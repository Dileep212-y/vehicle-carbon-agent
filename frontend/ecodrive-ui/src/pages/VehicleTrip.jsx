import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  CarFront,
  Check,
  Clock3,
  Fuel,
  Gauge,
  Leaf,
  MapPin,
  Play,
  Route,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react";

import { useEcoDrive } from "../context/EcoDriveContext";
import ecoSwiftImage from "../assets/eco-swift.png";
import "./VehicleTrip.css";

const FUEL_OPTIONS = [
  { id: "petrol", label: "Petrol", icon: Fuel },
  { id: "diesel", label: "Diesel", icon: Fuel },
  { id: "cng", label: "CNG", icon: Leaf },
  { id: "lpg", label: "LPG", icon: Zap },
];

const DRIVING_OPTIONS = ["Eco", "Normal", "Aggressive"];
const TRAFFIC_OPTIONS = ["Low", "Moderate", "Heavy"];
const ROAD_OPTIONS = ["Highway", "City", "Mixed"];
const CONDITION_OPTIONS = ["Good", "Normal", "Poor"];
const LOAD_OPTIONS = ["Light", "Normal", "Heavy"];

function formatNumber(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toFixed(digits);
}

const VEHICLE_TRIP_PREFS_KEY = "ecodrive:vehicle-trip-preferences";

function loadVehicleTripPreferences() {
  try {
    const raw = localStorage.getItem(VEHICLE_TRIP_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function VehicleTrip() {
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();

  const [savedPreferences] = useState(loadVehicleTripPreferences);

  const [fuelType, setFuelType] = useState(() => savedPreferences.fuelType || "petrol");
  const [mileage, setMileage] = useState(() => Number(savedPreferences.mileage) || 15);
  const [engineCapacity, setEngineCapacity] = useState(
    () => Number(savedPreferences.engineCapacity) || 1.5
  );

  const [distance, setDistance] = useState(
    () => Number(savedPreferences.distance) || 500
  );
  const [fuelPrice, setFuelPrice] = useState(
    () => Number(savedPreferences.fuelPrice) || 105
  );

  const [drivingStyle, setDrivingStyle] = useState(
    () => savedPreferences.drivingStyle || "Eco"
  );
  const [trafficLevel, setTrafficLevel] = useState(
    () => savedPreferences.trafficLevel || "Low"
  );
  const [roadType, setRoadType] = useState(
    () => savedPreferences.roadType || "Highway"
  );
  const [roadCondition, setRoadCondition] = useState(
    () => savedPreferences.roadCondition || "Good"
  );
  const [vehicleLoad, setVehicleLoad] = useState(
    () => savedPreferences.vehicleLoad || "Light"
  );

  const [showDemo, setShowDemo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [analysisMessage, setAnalysisMessage] = useState("");

  useEffect(() => {
    const preferences = {
      fuelType,
      mileage,
      engineCapacity,
      distance,
      fuelPrice,
      drivingStyle,
      trafficLevel,
      roadType,
      roadCondition,
      vehicleLoad,
    };

    try {
      localStorage.setItem(
        VEHICLE_TRIP_PREFS_KEY,
        JSON.stringify(preferences)
      );
    } catch {
      // Keep the page usable if browser storage is unavailable.
    }
  }, [
    fuelType,
    mileage,
    engineCapacity,
    distance,
    fuelPrice,
    drivingStyle,
    trafficLevel,
    roadType,
    roadCondition,
    vehicleLoad,
  ]);

  const estimatedSpeed = useMemo(() => {
    if (drivingStyle === "Eco") return 75;
    if (drivingStyle === "Normal") return 65;
    return 55;
  }, [drivingStyle]);

  const estimatedTime = useMemo(() => {
    return Math.max(0.5, distance / estimatedSpeed);
  }, [distance, estimatedSpeed]);

  const estimatedFuel = useMemo(() => {
    return distance / Math.max(mileage, 1);
  }, [distance, mileage]);

  const estimatedCost = useMemo(() => {
    return estimatedFuel * fuelPrice;
  }, [estimatedFuel, fuelPrice]);

  const handleAnalyze = async () => {
    setAnalysisMessage("");

    try {
      /*
       * The current FastAPI model does not require engine capacity,
       * road condition, or driving-style text directly.
       *
       * We translate the visual journey settings into the numerical
       * inputs expected by the existing EcoDrive pipeline.
       */

      let averageSpeed = estimatedSpeed;
      let maxSpeed = 85;
      let hardAccelerations = 2;
      let hardBrakings = 2;
      let idleMinutes = 5;

      if (drivingStyle === "Normal") {
        averageSpeed = 65;
        maxSpeed = 95;
        hardAccelerations = 5;
        hardBrakings = 4;
        idleMinutes = 10;
      }

      if (drivingStyle === "Aggressive") {
        averageSpeed = 55;
        maxSpeed = 125;
        hardAccelerations = 10;
        hardBrakings = 8;
        idleMinutes = 18;
      }

      if (trafficLevel === "Moderate") {
        idleMinutes += 8;
      }

      if (trafficLevel === "Heavy") {
        idleMinutes += 18;
        hardBrakings += 2;
      }

      if (vehicleLoad === "Normal") {
        hardAccelerations += 1;
      }

      if (vehicleLoad === "Heavy") {
        hardAccelerations += 3;
        hardBrakings += 2;
      }

      if (roadCondition === "Poor") {
        hardBrakings += 2;
      }

      const payload = {
        mileage_km_per_litre: Number(mileage),
        fuel_type: fuelType,
        vehicle_age_years: 3,

        average_speed_kmh: Number(averageSpeed),
        max_speed_kmh: Number(maxSpeed),
        hard_accelerations: Number(hardAccelerations),
        hard_brakings: Number(hardBrakings),
        idle_minutes: Number(idleMinutes),

        ac_usage: "moderate",
        traffic_level: trafficLevel.toLowerCase(),
        vehicle_load: vehicleLoad.toLowerCase(),

        acceleration_mps2:
          drivingStyle === "Aggressive"
            ? 3.2
            : drivingStyle === "Normal"
              ? 2.0
              : 1.2,

        braking_mps2:
          drivingStyle === "Aggressive"
            ? 3.0
            : drivingStyle === "Normal"
              ? 2.0
              : 1.1,

        distance_km: Number(distance),
        road_type: roadType.toLowerCase(),
        fuel_price_per_litre: Number(fuelPrice),

        route_a_distance_km: Number(distance),
        route_a_traffic_level: trafficLevel.toLowerCase(),

        route_b_distance_km: Number(
          Math.round(distance * (roadType === "Highway" ? 1.12 : 1.08))
        ),
        route_b_traffic_level:
          trafficLevel === "Heavy"
            ? "moderate"
            : trafficLevel.toLowerCase(),
      };

      await runAnalysis(payload);

      try {
        localStorage.setItem(
          VEHICLE_TRIP_PREFS_KEY,
          JSON.stringify({
            fuelType,
            mileage,
            engineCapacity,
            distance,
            fuelPrice,
            drivingStyle,
            trafficLevel,
            roadType,
            roadCondition,
            vehicleLoad,
          })
        );
      } catch {
        // The analysis result is still valid even if local storage is unavailable.
      }

      setAnalysisMessage(
        "Analysis completed. Your updated EcoDrive results are now available across Dashboard, Driving, Route and Carbon pages."
      );
    } catch (error) {
      setAnalysisMessage(
        error?.message ||
          "The EcoDrive analysis could not be completed. Please check that the backend is running."
      );
    }
  };

  const pipeline = analysis?.pipeline || {};
  const vehicleAnalysis = pipeline?.vehicle_analysis || {};
  const summary = pipeline?.summary || {};

  const backendMileage =
    vehicleAnalysis?.mileage_km_per_litre ?? mileage;

  const backendEfficiency =
    vehicleAnalysis?.efficiency_score ?? "—";

  const backendLevel =
    vehicleAnalysis?.efficiency_level || "Ready for analysis";

  return (
    <main className="journey-page">
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="journey-hero">
        <div className="journey-hero-copy">
          <div className="journey-kicker">
            <span />
            VEHICLE &amp; TRIP
          </div>

          <h1>
            Plan Your Journey
            <br />
            <span>Smarter.</span>
          </h1>

          <p>
            Give us a few details about your vehicle and trip.
            Our AI will analyze the rest — fuel consumption,
            cost, emissions and smarter travel options.
          </p>

          <div className="journey-hero-actions">
            <button
              type="button"
              className="journey-demo-button"
              onClick={() => setShowDemo((value) => !value)}
            >
              <Play size={15} fill="currentColor" />
              {showDemo ? "Close Demo" : "Watch Demo"}
            </button>

            <div className="journey-status">
              <span
                className={
                  backendOnline
                    ? "status-dot online"
                    : "status-dot offline"
                }
              />
              {backendOnline
                ? "EcoDrive Engine Online"
                : "Backend Offline"}
            </div>
          </div>

          {showDemo && (
            <div className="journey-demo-panel">
              <div className="demo-icon">
                <Sparkles size={19} />
              </div>

              <div>
                <strong>EcoDrive AI Analysis Flow</strong>
                <span>
                  Vehicle Analysis → Driving Behavior → ML Fuel
                  Prediction → Route Optimization → Carbon Impact
                  → Eco Optimization
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="journey-hero-visual">
          <div className="hero-glow" />

          <div className="hero-ring ring-one" />
          <div className="hero-ring ring-two" />

          <div className="hero-car-frame">
            <img
              src={ecoSwiftImage}
              alt="EcoDrive reference vehicle"
            />
          </div>

          <div className="hero-floating-card hero-card-top">
            <Leaf size={17} />
            <div>
              <span>DRIVE CLEAN</span>
              <strong>Live Green</strong>
            </div>
          </div>

          <div className="hero-floating-card hero-card-bottom">
            <Gauge size={17} />
            <div>
              <span>AI VEHICLE PROFILE</span>
              <strong>{backendLevel}</strong>
            </div>
          </div>

          <div className="hero-quote">
            <span>“</span>
            Small choices
            <br />
            make a greener world.
          </div>
        </div>
      </section>

      {/* =====================================================
          VEHICLE + TRIP
      ====================================================== */}

      <section className="journey-main-grid">
        {/* VEHICLE */}

        <article className="journey-panel vehicle-panel">
          <div className="journey-panel-heading">
            <div className="step-number">1</div>

            <div>
              <span>YOUR VEHICLE</span>
              <h2>Select your vehicle</h2>
              <p>Select your fuel type and key specifications.</p>
            </div>
          </div>

          <div className="field-label">
            <Fuel size={16} />
            Fuel Type
          </div>

          <div className="fuel-grid">
            {FUEL_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = fuelType === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`fuel-option ${
                    active ? "active" : ""
                  }`}
                  onClick={() => setFuelType(option.id)}
                >
                  <Icon size={20} />

                  <span>{option.label}</span>

                  {active && (
                    <Check
                      size={15}
                      className="fuel-check"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="vehicle-detail-area">
            <div className="vehicle-art">
              <div className="vehicle-platform" />

              <img
                src={ecoSwiftImage}
                alt="EcoDrive vehicle"
              />

              <div className="vehicle-badge">
                <CarFront size={14} />
                EcoDrive Vehicle
              </div>

              <div className="vehicle-tagline">
                Efficient.
                <br />
                Reliable.
                <br />
                <span>Greener Future.</span>
              </div>
            </div>

            <div className="vehicle-controls">
              <div className="control-card">
                <div className="control-card-top">
                  <div>
                    <span>MILEAGE</span>
                    <strong>{formatNumber(mileage)} km/L</strong>
                  </div>

                  <Gauge size={20} />
                </div>

                <input
                  type="range"
                  min="5"
                  max="30"
                  step="0.5"
                  value={mileage}
                  onChange={(event) =>
                    setMileage(Number(event.target.value))
                  }
                />

                <div className="range-labels">
                  <span>5 km/L</span>
                  <span>30 km/L</span>
                </div>
              </div>

              <div className="control-card">
                <div className="control-card-top">
                  <div>
                    <span>ENGINE CAPACITY</span>
                    <strong>{formatNumber(engineCapacity)} L</strong>
                  </div>

                  <Zap size={20} />
                </div>

                <input
                  type="range"
                  min="0.8"
                  max="5"
                  step="0.1"
                  value={engineCapacity}
                  onChange={(event) =>
                    setEngineCapacity(
                      Number(event.target.value)
                    )
                  }
                />

                <div className="range-labels">
                  <span>0.8 L</span>
                  <span>5.0 L</span>
                </div>
              </div>

              <div className="vehicle-backend-status">
                <div>
                  <span>BACKEND VEHICLE PROFILE</span>
                  <strong>
                    {formatNumber(backendMileage)} km/L
                  </strong>
                </div>

                <div className="backend-score">
                  {backendEfficiency}
                  <small>/100</small>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* TRIP */}

        <article className="journey-panel trip-panel">
          <div className="journey-panel-heading">
            <div className="step-number">2</div>

            <div>
              <span>YOUR TRIP</span>
              <h2>Set your journey</h2>
              <p>Define the distance and fuel price.</p>
            </div>
          </div>

          <div className="trip-route-visual">
            <div className="route-line">
              <span className="route-point start" />
              <span className="route-point end" />
            </div>

            <div className="route-label start-label">
              <MapPin size={14} />
              START
            </div>

            <div className="route-label end-label">
              <MapPin size={14} />
              DESTINATION
            </div>

            <div className="route-wind">
              <Route size={55} />
            </div>
          </div>

          <div className="trip-control">
            <div className="trip-control-heading">
              <div>
                <span>TRIP DISTANCE</span>
                <strong>{distance} km</strong>
              </div>

              <MapPin size={21} />
            </div>

            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={distance}
              onChange={(event) =>
                setDistance(Number(event.target.value))
              }
            />

            <div className="range-labels">
              <span>10 km</span>
              <span>1000 km</span>
            </div>
          </div>

          <div className="trip-control">
            <div className="trip-control-heading">
              <div>
                <span>FUEL PRICE (₹ / L)</span>
                <strong>₹{fuelPrice}</strong>
              </div>

              <Fuel size={21} />
            </div>

            <input
              type="range"
              min="70"
              max="160"
              step="1"
              value={fuelPrice}
              onChange={(event) =>
                setFuelPrice(Number(event.target.value))
              }
            />

            <div className="range-labels">
              <span>₹70</span>
              <span>₹160</span>
            </div>
          </div>

          <div className="trip-summary-mini">
            <div>
              <span>EST. FUEL</span>
              <strong>{formatNumber(estimatedFuel)} L</strong>
            </div>

            <div>
              <span>EST. COST</span>
              <strong>₹{Math.round(estimatedCost)}</strong>
            </div>

            <div>
              <span>TRIP TIME</span>
              <strong>{formatNumber(estimatedTime, 1)} h</strong>
            </div>
          </div>
        </article>
      </section>

      {/* =====================================================
          TRIP CONDITIONS
      ====================================================== */}

      <section className="journey-panel conditions-panel">
        <div className="conditions-header">
          <div className="journey-panel-heading">
            <div className="step-number">3</div>

            <div>
              <span>TRIP CONDITIONS</span>
              <h2>Fine-tune your journey</h2>
              <p>
                Optional conditions help the AI make more accurate
                fuel and emissions predictions.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="advanced-toggle"
            onClick={() =>
              setShowAdvanced((value) => !value)
            }
          >
            {showAdvanced
              ? "Hide Advanced Options"
              : "Show Advanced Options"}

            <ArrowRight
              size={15}
              className={
                showAdvanced ? "rotate-up" : ""
              }
            />
          </button>
        </div>

        {showAdvanced && (
          <div className="condition-grid">
            <ConditionGroup
              icon={<Leaf size={18} />}
              title="Driving Style"
              options={DRIVING_OPTIONS}
              value={drivingStyle}
              onChange={setDrivingStyle}
            />

            <ConditionGroup
              icon={<CarFront size={18} />}
              title="Traffic Level"
              options={TRAFFIC_OPTIONS}
              value={trafficLevel}
              onChange={setTrafficLevel}
            />

            <ConditionGroup
              icon={<Route size={18} />}
              title="Road Type"
              options={ROAD_OPTIONS}
              value={roadType}
              onChange={setRoadType}
            />

            <ConditionGroup
              icon={<Wind size={18} />}
              title="Road Condition"
              options={CONDITION_OPTIONS}
              value={roadCondition}
              onChange={setRoadCondition}
            />

            <ConditionGroup
              icon={<BatteryCharging size={18} />}
              title="Vehicle Load"
              options={LOAD_OPTIONS}
              value={vehicleLoad}
              onChange={setVehicleLoad}
            />
          </div>
        )}
      </section>

      {/* =====================================================
          LIVE TRIP PREVIEW
      ====================================================== */}

      <section className="journey-panel live-preview">
        <div className="live-preview-heading">
          <div>
            <span>LIVE TRIP PREVIEW</span>
            <h2>Here’s your journey setup</h2>
            <p>
              Review your inputs before sending them to the
              EcoDrive AI pipeline.
            </p>
          </div>

          <div className="preview-live">
            <span />
            LIVE
          </div>
        </div>

        <div className="preview-grid">
          <PreviewCard
            icon={<CarFront size={20} />}
            label="Vehicle"
            value={
              fuelType.charAt(0).toUpperCase() +
              fuelType.slice(1)
            }
            sub={`${formatNumber(mileage)} km/L`}
          />

          <PreviewCard
            icon={<MapPin size={20} />}
            label="Distance"
            value={`${distance} km`}
            sub={roadType}
          />

          <PreviewCard
            icon={<Fuel size={20} />}
            label="Fuel Price"
            value={`₹${fuelPrice}`}
            sub="per litre"
          />

          <PreviewCard
            icon={<Clock3 size={20} />}
            label="Est. Trip Time"
            value={`~ ${formatNumber(
              estimatedTime,
              1
            )} hours`}
            sub={`at ${estimatedSpeed} km/h`}
          />
        </div>

        <div className="preview-visual">
          <div className="preview-visual-glow" />

          <div className="preview-road">
            <div className="road-line road-line-one" />
            <div className="road-line road-line-two" />
            <div className="road-line road-line-three" />
          </div>

          <div className="preview-copy">
            <span>ECODRIVE JOURNEY</span>
            <strong>
              Same Roads.
              <br />
              <em>A Cleaner Tomorrow.</em>
            </strong>
          </div>

          <img
            src={ecoSwiftImage}
            alt="EcoDrive preview vehicle"
          />
        </div>
      </section>

      {/* =====================================================
          ANALYZE CTA
      ====================================================== */}

      <section className="analyze-cta">
        <div className="cta-orb">
          <Sparkles size={30} />
        </div>

        <div className="cta-copy">
          <span>AI-POWERED JOURNEY ANALYSIS</span>

          <h2>Ready to see the impact?</h2>

          <p>
            Let EcoDrive AI analyze your vehicle, driving
            behavior, fuel consumption, route, carbon emissions
            and optimization opportunities.
          </p>
        </div>

        <button
          type="button"
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner" />
              Analyzing Journey...
            </>
          ) : (
            <>
              <Sparkles size={19} />
              Analyze My Journey
              <ArrowRight size={19} />
            </>
          )}
        </button>
      </section>

      {analysisMessage && (
        <div
          className={`analysis-result-message ${
            analysisMessage.includes("completed")
              ? "success"
              : "error"
          }`}
        >
          <div>
            {analysisMessage.includes("completed") ? (
              <Check size={19} />
            ) : (
              <Zap size={19} />
            )}
          </div>

          <span>{analysisMessage}</span>
        </div>
      )}

      {/* =====================================================
          FEATURE STRIP
      ====================================================== */}

      <section className="journey-feature-strip">
        <Feature
          icon={<Sparkles size={20} />}
          title="AI-Powered Insights"
          text="Smarter decisions, cleaner journeys."
        />

        <Feature
          icon={<Fuel size={20} />}
          title="Save Fuel & Money"
          text="Optimized for real-world conditions."
        />

        <Feature
          icon={<Leaf size={20} />}
          title="Reduce Emissions"
          text="A greener planet for future generations."
        />
      </section>
    </main>
  );
}

function ConditionGroup({
  icon,
  title,
  options,
  value,
  onChange,
}) {
  return (
    <div className="condition-group">
      <div className="condition-title">
        <div className="condition-icon">{icon}</div>
        <span>{title}</span>
      </div>

      <div className="condition-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={
              value === option ? "active" : ""
            }
            onClick={() => onChange(option)}
          >
            {value === option && (
              <Check size={12} />
            )}

            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreviewCard({
  icon,
  label,
  value,
  sub,
}) {
  return (
    <div className="preview-card">
      <div className="preview-card-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="journey-feature">
      <div className="feature-icon">{icon}</div>

      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}