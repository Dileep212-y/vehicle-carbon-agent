import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  Fuel,
  Gauge,
  Leaf,
  MapPin,
  MoreHorizontal,
  Route,
  Search,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import "./History.css";
import "./HistoryModal.css";
import { useEcoDrive } from "../context/EcoDriveContext";
import { downloadEcoReport } from "../services/api";

const periods = ["7 Days", "30 Days", "3 Months", "All Time"];
const filters = ["All", "Eco", "Normal", "Traffic"];

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: "Unknown date",
      time: "Unknown time",
    };
  }

  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function formatDuration(distance, averageSpeed) {
  const safeDistance = number(distance);
  const safeSpeed = number(averageSpeed, 45);

  if (!safeDistance || !safeSpeed) {
    return "Not available";
  }

  const totalMinutes = Math.max(1, Math.round((safeDistance / safeSpeed) * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes} min`;
}

function getAnalysisName(payload, summary, route, fuel, driving) {
  const distance = number(
    payload?.distance_km ?? fuel?.distance_km ?? summary?.distance_km
  );

  const score = number(
    summary?.eco_performance_score ??
      summary?.overall_score ??
      0
  );

  const traffic = String(
    payload?.traffic_level ?? driving?.traffic_level ?? ""
  ).toLowerCase();

  const drivingStyle = String(
    payload?.driving_style ?? payload?.drivingStyle ?? ""
  ).toLowerCase();

  const routeSaved = number(
    route?.estimated_fuel_saved_litres ??
      route?.fuel_saved_litres ??
      summary?.route_fuel_saved_litres
  );

  const recommendedRoute = String(
    route?.recommended_route ?? summary?.recommended_route ?? ""
  ).toLowerCase();

  if (routeSaved > 0 || recommendedRoute.includes("route b")) {
    return "AI Route Optimization";
  }

  if (distance >= 100) {
    return "Long Distance Efficiency Run";
  }

  if (traffic === "heavy" || drivingStyle === "aggressive") {
    return "High-Impact Driving Analysis";
  }

  if (score >= 80) {
    return "Eco Performance Run";
  }

  if (score > 0 && score < 50) {
    return "Driving Improvement Analysis";
  }

  return "Fuel & Driving Efficiency Review";
}

function normalizeSnapshot(snapshot, index) {
  const result = snapshot?.result || {};
  const pipeline = result?.pipeline || {};
  const summary = pipeline?.summary || result?.summary || {};
  const payload = snapshot?.payload || {};

  const fuel = pipeline?.fuel_prediction || {};
  const carbon = pipeline?.carbon_impact || {};
  const driving = pipeline?.driving_analysis || {};
  const route = pipeline?.route_comparison || {};
  const eco = pipeline?.eco_performance || {};

  const distance = number(
    payload?.distance_km ??
      carbon?.distance_km ??
      fuel?.distance_km ??
      summary?.distance_km
  );

  const predictedFuel = number(
    fuel?.predicted_fuel_consumption_l_per_100km ??
      summary?.predicted_fuel_consumption_l_per_100km
  );

  const tripFuel = number(
    carbon?.estimated_fuel_consumed_litres ??
      carbon?.estimated_trip_fuel_litres ??
      summary?.estimated_trip_fuel_litres ??
      (predictedFuel > 0 && distance > 0
        ? (predictedFuel * distance) / 100
        : 0)
  );

  const emissions = number(
    carbon?.estimated_co2_emissions_kg ??
      carbon?.co2_emissions_kg ??
      summary?.estimated_trip_co2_kg
  );

  const efficiency = number(
    fuel?.equivalent_fuel_efficiency_kmpl ??
      summary?.equivalent_fuel_efficiency_kmpl
  );

  const score = number(
    eco?.overall_score ??
      summary?.eco_performance_score
  );

  const drivingScore = number(
    driving?.driving_efficiency_score ??
      summary?.driving_score
  );

  const routeSaved = number(
    route?.estimated_fuel_saved_litres ??
      summary?.route_fuel_saved_litres
  );

  const routeReduction = number(
    route?.estimated_co2_reduction_kg ??
      summary?.route_co2_reduction_kg
  );

  const fuelType = String(
    payload?.fuel_type || fuel?.fuel_type || "Petrol"
  );

  const routeName =
    route?.recommended_route ||
    summary?.recommended_route ||
    "AI route analysis";

  const createdAt = snapshot?.createdAt || new Date().toISOString();
  const dateTime = formatDateTime(createdAt);

  const name = getAnalysisName(
    payload,
    summary,
    route,
    fuel,
    driving
  );

  const traffic = String(
    payload?.traffic_level || driving?.traffic_level || "moderate"
  );

  let type = "Normal";

  if (routeSaved > 0 || routeName.toLowerCase().includes("route b")) {
    type = "Eco";
  } else if (
    traffic.toLowerCase() === "heavy" ||
    drivingScore < 50
  ) {
    type = "Traffic";
  } else if (score >= 75) {
    type = "Eco";
  }

  return {
    id: snapshot?.id || `RUN-${index + 1}`,
    name,
    date: dateTime.date,
    time: dateTime.time,
    createdAt,
    from: "Current journey",
    to: "AI analysis",
    distance,
    duration: formatDuration(
      distance,
      payload?.average_speed_kmh ?? driving?.average_speed_kmh
    ),
    fuel: tripFuel,
    emissions,
    efficiency,
    score,
    drivingScore,
    type,
    fuelType,
    routeName,
    routeSaved,
    routeReduction,
    payload,
    result,
  };
}

export default function History() {
  const { analysisHistory, restoreAnalysis } = useEcoDrive();
  const navigate = useNavigate();

  const [period, setPeriod] = useState("All Time");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [menu, setMenu] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const history = useMemo(
    () =>
      Array.isArray(analysisHistory)
        ? analysisHistory.map(normalizeSnapshot)
        : [],
    [analysisHistory]
  );

  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();

    const now = Date.now();

    const periodDays = {
      "7 Days": 7,
      "30 Days": 30,
      "3 Months": 90,
      "All Time": null,
    };

    const days = periodDays[period];

    return history.filter((trip) => {
      const created = new Date(trip.createdAt).getTime();

      const matchesPeriod =
        days === null ||
        (Number.isFinite(created) &&
          now - created <= days * 24 * 60 * 60 * 1000);

      const matchesFilter =
        filter === "All" ||
        (filter === "Eco" && trip.type === "Eco") ||
        (filter === "Normal" && trip.type === "Normal") ||
        (filter === "Traffic" && trip.type === "Traffic");

      const searchable = [
        trip.name,
        trip.id,
        trip.from,
        trip.to,
        trip.type,
        trip.fuelType,
        trip.routeName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      return matchesPeriod && matchesFilter && matchesSearch;
    });
  }, [history, period, filter, search]);

  const totals = useMemo(() => {
    return filteredTrips.reduce(
      (acc, trip) => {
        acc.distance += trip.distance;
        acc.fuel += trip.fuel;
        acc.emissions += trip.emissions;
        acc.routeReduction += trip.routeReduction;
        return acc;
      },
      {
        distance: 0,
        fuel: 0,
        emissions: 0,
        routeReduction: 0,
      }
    );
  }, [filteredTrips]);

  const averageScore =
    filteredTrips.length > 0
      ? Math.round(
          filteredTrips.reduce(
            (sum, trip) => sum + trip.score,
            0
          ) / filteredTrips.length
        )
      : 0;

  const averageEfficiency =
    filteredTrips.length > 0
      ? (
          filteredTrips.reduce(
            (sum, trip) => sum + trip.efficiency,
            0
          ) / filteredTrips.length
        ).toFixed(1)
      : "0.0";

  const latestResult =
    filteredTrips.length > 0
      ? filteredTrips[0].result
      : analysisHistory?.[0]?.result || null;

  function handleExportLatest() {
    if (!latestResult) return;
    downloadEcoReport(latestResult);
  }

  function handleExportTrip(trip) {
    if (!trip?.result) return;
    downloadEcoReport(trip.result);
    setMenu(null);
  }

  function handleOpenAnalysis(trip) {
    setSelectedTrip(trip);
    setMenu(null);
  }

  function handleRestoreAnalysis(trip) {
    if (!trip?.result) return;

    restoreAnalysis(trip.result, trip.payload || {});
    setSelectedTrip(null);
    navigate("/dashboard");
  }

  return (
    <main className="history-page">
      <section className="history-hero">
        <div className="history-hero-copy">
          <div className="history-kicker">
            <span />
            DRIVE MEMORY
          </div>

          <h1>
            Every journey
            <span>leaves a trace.</span>
          </h1>

          <p>
            Review your driving history, fuel usage, emissions and
            EcoDrive insights across every recorded analysis.
          </p>

          <div className="history-periods">
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                className={period === item ? "active" : ""}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="history-orbit">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-ring ring-three" />

          <div className="history-orb">
            <Leaf size={35} />
            <strong>{averageScore}</strong>
            <span>AVG ECO SCORE</span>
          </div>

          <div className="orbit-stat orbit-stat-top">
            <TrendingDown size={15} />
            <div>
              <span>ROUTE CO₂ REDUCTION</span>
              <strong>
                {totals.routeReduction.toFixed(2)} kg
              </strong>
            </div>
          </div>

          <div className="orbit-stat orbit-stat-bottom">
            <Fuel size={15} />
            <div>
              <span>AVG FUEL EFFICIENCY</span>
              <strong>{averageEfficiency} km/L</strong>
            </div>
          </div>
        </div>

        <div className="history-summary">
          <span>THIS PERIOD</span>

          <div className="summary-number">
            <strong>{filteredTrips.length}</strong>
            <span>analyses</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-mini">
            <span>TOTAL DISTANCE</span>
            <strong>{totals.distance.toFixed(1)} km</strong>
          </div>

          <div className="summary-mini">
            <span>EST. FUEL</span>
            <strong>{totals.fuel.toFixed(2)} L</strong>
          </div>

          <div className="summary-mini">
            <span>EST. CO₂</span>
            <strong>{totals.emissions.toFixed(1)} kg</strong>
          </div>
        </div>
      </section>

      <section className="history-content">
        <div className="history-toolbar">
          <div className="history-heading">
            <span>JOURNEY LOG</span>
            <h2>Your analyzed drives.</h2>
          </div>

          <button
            type="button"
            className="export-button"
            onClick={handleExportLatest}
            disabled={!latestResult}
          >
            <Download size={14} />
            Export report
          </button>
        </div>

        <div className="history-controls">
          <div className="history-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search analysis, fuel type, route..."
            />
          </div>

          <div className="history-filter">
            {filters.map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="history-list">
          {filteredTrips.map((trip, index) => {
            const isExpanded = expanded === trip.id;

            return (
              <article
                className={`history-trip ${
                  isExpanded ? "expanded" : ""
                }`}
                key={trip.id}
                style={{ "--delay": `${index * 55}ms` }}
              >
                <div className="trip-main">
                  <div className="trip-identity">
                    <div className="trip-identity-icon">
                      <CalendarDays size={19} />
                    </div>
                    <div className="trip-identity-copy">
                      <strong>{trip.name}</strong>
                      <span>{trip.date} · {trip.time}</span>
                      <div className="trip-tags">
                        <span>{trip.fuelType}</span>
                        <span>{trip.routeName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="trip-metric">
                    <span>DISTANCE</span>
                    <strong>{trip.distance.toFixed(1)} km</strong>
                  </div>

                  <div className="trip-metric">
                    <span>EST. FUEL</span>
                    <strong>{trip.fuel.toFixed(2)} L</strong>
                  </div>

                  <div className="trip-metric emission-metric">
                    <span>CO₂</span>
                    <strong>{trip.emissions.toFixed(2)} kg</strong>
                  </div>

                  <div className="trip-metric">
                    <span>EFFICIENCY</span>
                    <strong>{trip.efficiency.toFixed(1)} km/L</strong>
                  </div>

                  <div className="trip-score">
                    <div
                      className="score-circle"
                      style={{
                        "--score":
                          Math.max(0, Math.min(100, trip.score)) * 3.6 + "deg",
                      }}
                    >
                      <span>{Math.round(trip.score)}</span>
                    </div>
                    <div className="score-copy">
                      <strong>Eco</strong>
                      <small>score</small>
                    </div>
                  </div>

                  <div className="trip-actions">
                    <button
                      type="button"
                      title="More options"
                      onClick={() =>
                        setMenu(menu === trip.id ? null : trip.id)
                      }
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    <button
                      type="button"
                      className="view-analysis-button"
                      title="View analysis"
                      onClick={() =>
                        setExpanded(isExpanded ? null : trip.id)
                      }
                    >
                      <span>{isExpanded ? "Close" : "View"}</span>
                      <ChevronRight
                        size={16}
                        className={isExpanded ? "rotated" : ""}
                      />
                    </button>

                    {menu === trip.id && (
                      <div className="trip-menu">
                        <button
                          type="button"
                          onClick={() => setExpanded(trip.id)}
                        >
                          View analysis
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportTrip(trip)}
                        >
                          Export analysis
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="trip-expanded">
                    <div className="expanded-route">
                      <div className="expanded-route-icon">
                        <Route size={18} />
                      </div>

                      <div>
                        <span>ANALYSIS PROFILE</span>
                        <strong>{trip.name}</strong>
                        <p>
                          {trip.distance.toFixed(1)} km{" "}
                          analysis using the EcoDrive AI
                          pipeline.
                        </p>
                      </div>
                    </div>

                    <div className="expanded-stats">
                      <div>
                        <GaugeIcon />
                        <span>FUEL EFFICIENCY</span>
                        <strong>
                          {trip.efficiency.toFixed(1)} km/L
                        </strong>
                      </div>

                      <div>
                        <Clock3 size={17} />
                        <span>EST. TRAVEL TIME</span>
                        <strong>{trip.duration}</strong>
                      </div>

                      <div>
                        <Leaf size={17} />
                        <span>DRIVING SCORE</span>
                        <strong>
                          {Math.round(trip.drivingScore)}/100
                        </strong>
                      </div>

                      <div>
                        <Sparkles size={17} />
                        <span>AI STATUS</span>
                        <strong>Analyzed</strong>
                      </div>
                    </div>

                    <div className="expanded-insight">
                      <Sparkles size={16} />
                      <div>
                        <span>ECODRIVE INSIGHT</span>
                        <p>
                          {trip.routeSaved > 0
                            ? `The AI route analysis identified approximately ${trip.routeSaved.toFixed(
                                2
                              )} L of potential fuel savings.`
                            : `EcoDrive analyzed your ${trip.fuelType.toLowerCase()} journey using vehicle, driving, fuel, route and carbon-impact data.`}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="history-view-full"
                        onClick={() => handleOpenAnalysis(trip)}
                      >
                        View full analysis
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {filteredTrips.length === 0 && (
          <div className="history-empty">
            <Search size={24} />
            <h3>No journeys found</h3>
            <p>
              Run an analysis from Vehicle & Trip to create a
              new history record.
            </p>
          </div>
        )}

        <section className="history-bottom-grid">
          <article className="history-insight-card">
            <div className="insight-card-icon">
              <Leaf size={19} />
            </div>

            <div>
              <span>YOUR DRIVING MEMORY</span>
              <h3>
                Every analysis helps reveal your driving
                pattern.
              </h3>
              <p>
                EcoDrive keeps your completed AI analyses
                locally so you can compare fuel use, emissions,
                driving behavior and route recommendations.
              </p>
            </div>

            <ArrowUpRight size={18} />
          </article>

          <article className="history-streak-card">
            <div className="streak-icon">
              <Zap size={18} />
            </div>

            <div>
              <span>ANALYSIS STREAK</span>
              <strong>
                {Math.min(filteredTrips.length, 20)} runs
              </strong>
              <small>saved locally</small>
            </div>

            <div className="streak-bars">
              <i />
              <i />
              <i />
              <i />
              <i
                className={
                  filteredTrips.length >= 5 ? "" : "muted"
                }
              />
              <i
                className={
                  filteredTrips.length >= 6 ? "" : "muted"
                }
              />
              <i
                className={
                  filteredTrips.length >= 7 ? "" : "muted"
                }
              />
            </div>
          </article>
        </section>
      </section>

      {selectedTrip && (
        <div
          className="analysis-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedTrip(null);
            }
          }}
        >
          <section className="analysis-modal">
            <div className="analysis-modal-header">
              <div>
                <span>ECODRIVE AI · SAVED ANALYSIS</span>
                <h2>{selectedTrip.name}</h2>
                <p>
                  {selectedTrip.date} · {selectedTrip.time} ·{" "}
                  {selectedTrip.id}
                </p>
              </div>

              <button
                type="button"
                className="analysis-modal-close"
                onClick={() => setSelectedTrip(null)}
              >
                ×
              </button>
            </div>

            <div className="analysis-modal-grid">
              <div className="analysis-modal-card primary">
                <span>ECO PERFORMANCE</span>
                <strong>
                  {Math.round(selectedTrip.score)}/100
                </strong>
                <small>
                  {selectedTrip.result?.pipeline?.eco_performance
                    ?.overall_rating ||
                    selectedTrip.result?.pipeline?.summary
                      ?.eco_performance_rating ||
                    "Analyzed"}
                </small>
              </div>

              <div className="analysis-modal-card">
                <span>DISTANCE</span>
                <strong>
                  {selectedTrip.distance.toFixed(1)} km
                </strong>
                <small>Trip distance</small>
              </div>

              <div className="analysis-modal-card">
                <span>EST. FUEL</span>
                <strong>
                  {selectedTrip.fuel.toFixed(2)} L
                </strong>
                <small>
                  {selectedTrip.efficiency.toFixed(1)} km/L
                </small>
              </div>

              <div className="analysis-modal-card">
                <span>CO₂ IMPACT</span>
                <strong>
                  {selectedTrip.emissions.toFixed(2)} kg
                </strong>
                <small>Estimated trip emissions</small>
              </div>
            </div>

            <div className="analysis-modal-sections">
              <div className="analysis-detail-row">
                <div>
                  <Gauge size={17} />
                  <span>Driving behavior</span>
                </div>
                <strong>
                  {Math.round(selectedTrip.drivingScore)}/100
                </strong>
              </div>

              <div className="analysis-detail-row">
                <div>
                  <Fuel size={17} />
                  <span>Fuel type</span>
                </div>
                <strong>{selectedTrip.fuelType}</strong>
              </div>

              <div className="analysis-detail-row">
                <div>
                  <Route size={17} />
                  <span>Recommended route</span>
                </div>
                <strong>{selectedTrip.routeName}</strong>
              </div>

              <div className="analysis-detail-row">
                <div>
                  <TrendingDown size={17} />
                  <span>Potential route CO₂ reduction</span>
                </div>
                <strong>
                  {selectedTrip.routeReduction.toFixed(2)} kg
                </strong>
              </div>

              <div className="analysis-detail-row">
                <div>
                  <Zap size={17} />
                  <span>Potential route fuel saving</span>
                </div>
                <strong>
                  {selectedTrip.routeSaved.toFixed(2)} L
                </strong>
              </div>
            </div>

            <div className="analysis-modal-note">
              <Sparkles size={17} />
              <div>
                <span>AI ANALYSIS SUMMARY</span>
                <p>
                  This saved result contains the completed EcoDrive
                  pipeline: vehicle analysis, driving behavior, ML fuel
                  prediction, route comparison, carbon impact and
                  optimization recommendations.
                </p>
              </div>
            </div>

            <div className="analysis-modal-actions">
              <button
                type="button"
                className="modal-secondary"
                onClick={() => downloadEcoReport(selectedTrip.result)}
              >
                <Download size={16} />
                Export this report
              </button>

              <button
                type="button"
                className="modal-primary"
                onClick={() => handleRestoreAnalysis(selectedTrip)}
              >
                <Sparkles size={16} />
                Load this analysis
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function GaugeIcon() {
  return (
    <span className="custom-gauge">
      <Gauge size={17} />
    </span>
  );
}
