import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BrainCircuit,
  CarFront,
  ChevronDown,
  CircleGauge,
  Cloud,
  Droplets,
  Flame,
  Gauge,
  Leaf,
  MoveDownRight,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Carbon.css";
import { useEcoDrive } from "../context/EcoDriveContext";

import heroBg from "../assets/05_coastal_mountains.jpg";
import leafBg from "../assets/03_leaf_background.jpg";
import forestBg from "../assets/13_forest_dark.jpg";
import mistBg from "../assets/18_mist_forest.jpg";
import forestTopBg from "../assets/21_forest_top.jpg";

const trendData = [
  { day: "Mon", value: 128, target: 100 },
  { day: "Tue", value: 121, target: 100 },
  { day: "Wed", value: 116, target: 100 },
  { day: "Thu", value: 124, target: 100 },
  { day: "Fri", value: 108, target: 100 },
  { day: "Sat", value: 102, target: 100 },
  { day: "Sun", value: 112, target: 100 },
];

const sourceData = [
  { label: "Engine combustion", value: 52, icon: Flame },
  { label: "Idling", value: 18, icon: Timer },
  { label: "Acceleration", value: 15, icon: Zap },
  { label: "AC & electronics", value: 10, icon: Cloud },
  { label: "Other", value: 5, icon: Droplets },
];

const factorData = [
  {
    key: "speed",
    title: "Speed",
    value: "60",
    unit: "km/h",
    status: "Efficient zone",
    icon: Gauge,
    fill: 64,
    copy: "Steady cruising keeps fuel demand under control.",
  },
  {
    key: "acceleration",
    title: "Acceleration",
    value: "1.2",
    unit: "m/s²",
    status: "Moderate",
    icon: Zap,
    fill: 48,
    copy: "Smooth acceleration can lower unnecessary fuel spikes.",
  },
  {
    key: "braking",
    title: "Braking",
    value: "1.0",
    unit: "m/s²",
    status: "Controlled",
    icon: MoveDownRight,
    fill: 39,
    copy: "Predictive braking helps preserve momentum and efficiency.",
  },
  {
    key: "idle",
    title: "Idle time",
    value: "8",
    unit: "min",
    status: "Watch",
    icon: Timer,
    fill: 31,
    copy: "Reducing stationary engine time can improve trip efficiency.",
  },
];

function MetricRing({ score = null }) {
  const numericScore = Number.isFinite(Number(score)) ? Number(score) : null;
  return (
    <div className="carbon-ring-shell" aria-label={`Carbon efficiency score ${numericScore != null ? Math.round(numericScore) : "not available"}%`}>
      <div
        className="carbon-ring"
        style={{ "--score": `${(numericScore ?? 0) * 3.6}deg` }}
      >
        <div className="carbon-ring-inner">
          <span className="ring-kicker">CARBON</span>
          <strong>{numericScore != null ? `${Math.round(numericScore)}%` : "—"}</strong>
          <span className="ring-caption">efficiency</span>
        </div>
      </div>
    </div>
  );
}

function SourceBars() {
  return (
    <div className="source-bars">
      {sourceData.map((item) => {
        const Icon = item.icon;
        return (
          <div className="source-row" key={item.label}>
            <div className="source-row-top">
              <div className="source-name">
                <span className="source-icon"><Icon size={15} /></span>
                <span>{item.label}</span>
              </div>
              <strong>{item.value}%</strong>
            </div>
            <div className="source-track">
              <span style={{ width: `${item.value}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FactorCard({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`factor-card ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <div className="factor-card-glow" />
      <div className="factor-topline">
        <span className="factor-icon"><Icon size={18} /></span>
        <span className="factor-status">{item.status}</span>
      </div>
      <div className="factor-title">{item.title}</div>
      <div className="factor-number">
        {item.value}<span>{item.unit}</span>
      </div>
      <div className="factor-meter">
        <span style={{ width: `${item.fill}%` }} />
      </div>
      <p>{item.copy}</p>
      <div className="factor-footer">
        <span>Impact signal</span>
        <ArrowRight size={15} />
      </div>
    </button>
  );
}

export default function Carbon() {
  const [range, setRange] = useState("7 days");
  const navigate = useNavigate();
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();
  const summary = analysis?.summary;
  const impact = analysis?.pipeline?.carbon_impact;
  const fuelPrediction = analysis?.pipeline?.fuel_prediction;
  const driving = analysis?.pipeline?.driving_analysis;

  const co2Kg = Number(impact?.estimated_co2_emissions_kg ?? 8.4);
  const co2PerKm = Number(impact?.co2_per_km ?? 0.112);
  const co2GPerKm = co2PerKm * 1000;
  const tripFuel = Number(impact?.estimated_fuel_consumed_litres ?? fuelPrediction?.predicted_fuel_consumption_l_per_100km ?? 7.2);
  const distanceKm = Number(impact?.distance_km ?? 18.6);
  const fuelCost = Number(impact?.estimated_fuel_cost ?? 0);
  const ecoPerformance = analysis?.pipeline?.eco_performance || {};
  const carbonEfficiency = Number(ecoPerformance?.components?.carbon_intensity_score);
  const ecoScore = Number(summary?.eco_performance_score);
  const predictedFuel = Number(fuelPrediction?.predicted_fuel_consumption_l_per_100km ?? 7.2);
  const averageSpeed = Number(driving?.average_speed_kmh ?? 45);
  const acceleration = Number(fuelPrediction?.inputs?.acceleration_mps2 ?? 1.1);
  const braking = Number(fuelPrediction?.inputs?.braking_mps2 ?? 1.0);
  const idleMinutes = Number(driving?.idle_minutes ?? 5);

  const dynamicFactorData = [
    { key: "speed", title: "Speed", value: averageSpeed.toFixed(0), unit: "km/h", status: averageSpeed <= 60 ? "Efficient zone" : "Watch", icon: Gauge, fill: Math.min(100, Math.max(10, averageSpeed / 1.2)), copy: "Steady cruising keeps fuel demand under control." },
    { key: "acceleration", title: "Acceleration", value: acceleration.toFixed(1), unit: "m/s²", status: acceleration <= 1.2 ? "Moderate" : "High", icon: Zap, fill: Math.min(100, Math.max(10, acceleration * 40)), copy: "Smooth acceleration can lower unnecessary fuel spikes." },
    { key: "braking", title: "Braking", value: braking.toFixed(1), unit: "m/s²", status: braking <= 1.2 ? "Controlled" : "High", icon: MoveDownRight, fill: Math.min(100, Math.max(10, braking * 39)), copy: "Predictive braking helps preserve momentum and efficiency." },
    { key: "idle", title: "Idle time", value: idleMinutes.toFixed(0), unit: "min", status: idleMinutes <= 5 ? "Good" : "Watch", icon: Timer, fill: Math.min(100, Math.max(10, idleMinutes * 6)), copy: "Reducing stationary engine time can improve trip efficiency." },
  ];
  const [activeFactor, setActiveFactor] = useState("speed");

  const displayedCarbonEfficiency = Number.isFinite(carbonEfficiency)
    ? Math.round(Math.max(0, Math.min(100, carbonEfficiency)))
    : null;

  const activeFactorData = useMemo(
    () => dynamicFactorData.find((item) => item.key === activeFactor) ?? dynamicFactorData[0],
    [activeFactor]
  );
  const ActiveFactorIcon = activeFactorData.icon;

  return (
    <div className="carbon-page">
      <div className="carbon-atmosphere carbon-atmosphere-one" />
      <div className="carbon-atmosphere carbon-atmosphere-two" />
      <div className="carbon-grid-overlay" />

      <header className="carbon-page-header">
        <div>
          <div className="carbon-breadcrumb">
            <span>ECODRIVE AI</span>
            <ChevronDown size={13} />
            <strong>EMISSIONS ANALYSIS</strong>
          </div>
          <h1>
            Understand your <span>carbon signal.</span>
          </h1>
          <p>
            See the story behind every gram of CO₂ — from fuel demand and driving
            behavior to the opportunities your AI analysis can uncover.
          </p>
        </div>

        <div className="carbon-header-actions">
          <div className="preview-pill">
            <span className="live-dot" />
            {backendOnline ? "BACKEND CONNECTED" : "BACKEND OFFLINE"}
          </div>
          <button
            type="button"
            className="header-action-btn"
            onClick={() => runAnalysis().catch(() => {})}
          >
            <Activity size={16} />
            {loading ? "Analyzing…" : backendOnline ? "Refresh analysis" : "Live analysis"}
          </button>
        </div>
      </header>

      <section className="carbon-hero-visual">
        <div
          className="carbon-hero-image"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="carbon-hero-shade" />
        <div className="carbon-hero-content">
          <div className="eyebrow-chip">
            <Sparkles size={14} />
            AI CARBON INTELLIGENCE
          </div>
          <div className="hero-signal-row">
            <div>
              <span className="hero-metric-label">CURRENT CARBON INTENSITY</span>
              <div className="hero-metric-value">
                {co2GPerKm.toFixed(0)}<span> g/km</span>
              </div>
              <div className="hero-metric-change">
                <ArrowDownRight size={15} />
                18% below your previous baseline
              </div>
            </div>
            <MetricRing score={displayedCarbonEfficiency} />
          </div>
          <div className="hero-mini-grid">
            <div className="hero-mini-stat">
              <span>TRIP CO₂</span>
              <strong>{co2Kg.toFixed(3)} kg</strong>
            </div>
            <div className="hero-mini-stat">
              <span>FUEL DEMAND</span>
              <strong>{tripFuel.toFixed(3)} L</strong>
            </div>
            <div className="hero-mini-stat">
              <span>AI TARGET</span>
              <strong>{Math.max(0, co2GPerKm * 0.8).toFixed(0)} g/km</strong>
            </div>
          </div>
        </div>
        <div className="hero-float-card hero-float-card-one">
          <Leaf size={18} />
          <div>
            <span>LOWER EMISSIONS</span>
            <strong>Healthier route profile</strong>
          </div>
        </div>
        <div className="hero-float-card hero-float-card-two">
          <CarFront size={17} />
          <div>
            <span>VEHICLE SIGNAL</span>
            <strong>Hybrid-ready efficiency</strong>
          </div>
        </div>
      </section>

      <section className="carbon-kpi-strip">
        <article className="carbon-kpi">
          <span className="kpi-icon green"><Leaf size={18} /></span>
          <div>
            <small>TOTAL CO₂ EMISSIONS</small>
            <strong>{co2Kg.toFixed(3)} kg</strong>
            <span className="kpi-trend down"><ArrowDownRight size={13} /> -18%</span>
          </div>
        </article>
        <article className="carbon-kpi">
          <span className="kpi-icon cyan"><Gauge size={18} /></span>
          <div>
            <small>EMISSION INTENSITY</small>
            <strong>{co2GPerKm.toFixed(0)} g/km</strong>
            <span className="kpi-trend down"><ArrowDownRight size={13} /> -9%</span>
          </div>
        </article>
        <article className="carbon-kpi">
          <span className="kpi-icon violet"><BrainCircuit size={18} /></span>
          <div>
            <small>AI PREDICTED</small>
            <strong>{Math.max(0, co2GPerKm).toFixed(0)} g/km</strong>
            <span className="kpi-trend down"><ArrowDownRight size={13} /> -24%</span>
          </div>
        </article>
        <article className="carbon-kpi">
          <span className="kpi-icon amber"><CircleGauge size={18} /></span>
          <div>
            <small>REDUCTION POTENTIAL</small>
            <strong>{Math.max(0, Math.min(99, 100 - Math.round(ecoScore)))}%</strong>
            <span className="kpi-trend up">With optimization</span>
          </div>
        </article>
      </section>

      <section className="carbon-backend-strip">
        <div>
          <span className="panel-eyebrow">CARBON IMPACT PIPELINE</span>
          <strong>{backendOnline ? "Backend result connected" : "Waiting for backend"}</strong>
          <p>Trip fuel, fuel cost and tailpipe CO₂ are calculated by the EcoDrive carbon-impact tool.</p>
        </div>
        <div className="carbon-backend-values">
          <span><small>FUEL</small><strong>{tripFuel.toFixed(3)} L</strong></span>
          <span><small>COST</small><strong>₹{fuelCost.toFixed(2)}</strong></span>
          <span><small>CO₂</small><strong>{co2Kg.toFixed(3)} kg</strong></span>
          <span><small>INTENSITY</small><strong>{co2GPerKm.toFixed(0)} g/km</strong></span>
        </div>
      </section>

      <section className="carbon-main-grid">
        <article className="carbon-panel trend-panel">
          <div className="panel-heading-row">
            <div>
              <span className="panel-eyebrow">CARBON PULSE</span>
              <h2>Emissions trend</h2>
              <p>Intensity across your recent driving pattern.</p>
            </div>
            <div className="range-switcher">
              {["7 days", "30 days", "90 days"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={range === item ? "active" : ""}
                  onClick={() => setRange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 16, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="carbonArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#53e59c" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#53e59c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(125,196,176,0.10)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#75908e", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#617e7b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(7,20,23,0.96)",
                    border: "1px solid rgba(83,229,156,.24)",
                    borderRadius: 14,
                    color: "#fff",
                  }}
                  labelStyle={{ color: "#8ca8a4" }}
                  itemStyle={{ color: "#57e7a0" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#56e39b"
                  strokeWidth={3}
                  fill="url(#carbonArea)"
                  dot={{ r: 3, strokeWidth: 2, fill: "#08181b", stroke: "#56e39b" }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: "#0a171a", stroke: "#9cffca" }}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#65a8e2"
                  strokeWidth={1.5}
                  strokeDasharray="5 6"
                  fill="none"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><i className="legend-line green" /> Your emissions</span>
            <span><i className="legend-line cyan" /> Target band</span>
            <strong>{co2GPerKm.toFixed(0)} g/km today</strong>
          </div>
        </article>

        <article className="carbon-panel source-panel">
          <div className="panel-heading-row compact">
            <div>
              <span className="panel-eyebrow">EMISSION SOURCES</span>
              <h2>Where the signal comes from</h2>
            </div>
            <span className="source-total">112 <small>g/km</small></span>
          </div>
          <SourceBars />
          <div className="source-note">
            <Leaf size={16} />
            <p>Trip fuel, CO₂ and intensity values below are supplied by the connected EcoDrive carbon-impact stage. Source percentages remain illustrative until component-level telemetry is available.</p>
          </div>
        </article>
      </section>

      <section className="factor-section">
        <div className="section-title-block">
          <div>
            <span className="panel-eyebrow">DRIVING SIGNALS</span>
            <h2>What is influencing your footprint?</h2>
            <p>Explore the individual factors behind fuel demand and carbon intensity.</p>
          </div>
          <div className="signal-chip">
            <span className="signal-pulse" />
            4 live factors
          </div>
        </div>

        <div className="factor-layout">
          <div className="factor-card-grid">
            {dynamicFactorData.map((item) => (
              <FactorCard
                key={item.key}
                item={item}
                active={activeFactor === item.key}
                onClick={() => setActiveFactor(item.key)}
              />
            ))}
          </div>

          <aside
            className="factor-detail"
            style={{ backgroundImage: `linear-gradient(160deg, rgba(7,18,20,.10), rgba(7,18,20,.92)), url(${forestBg})` }}
          >
            <div className="detail-orbit orbit-one" />
            <div className="detail-orbit orbit-two" />
            <div className="detail-icon"><ActiveFactorIcon size={22} /></div>
            <span className="panel-eyebrow">ACTIVE SIGNAL</span>
            <h3>{activeFactorData.title}</h3>
            <div className="detail-value">
              {activeFactorData.value}<span>{activeFactorData.unit}</span>
            </div>
            <p>{activeFactorData.copy}</p>
            <div className="detail-progress">
              <div className="detail-progress-head">
                <span>Signal strength</span>
                <strong>{activeFactorData.fill}%</strong>
              </div>
              <div className="detail-progress-track">
                <span style={{ width: `${activeFactorData.fill}%` }} />
              </div>
            </div>
            <button
              type="button"
              className="detail-button"
              onClick={() => navigate("/assistant")}
            >
              View optimization signal
              <ArrowRight size={15} />
            </button>
          </aside>
        </div>
      </section>

      <section className="diagnosis-section">
        <div
          className="diagnosis-background"
          style={{ backgroundImage: `url(${mistBg})` }}
        />
        <div className="diagnosis-overlay" />
        <div className="diagnosis-copy">
          <div className="eyebrow-chip soft">
            <BrainCircuit size={14} />
            AI CARBON DIAGNOSIS
          </div>
          <h2>
            Turn carbon data into a <span>clear action.</span>
          </h2>
          <p>
            Your current signal suggests that steady speed, smoother acceleration and less idle time are the clearest opportunities for improvement.
          </p>
          <div className="diagnosis-points">
            <div><span>01</span><strong>Reduce harsh acceleration</strong><small>Smoother inputs reduce demand spikes.</small></div>
            <div><span>02</span><strong>Protect cruising momentum</strong><small>Consistent speed supports efficiency.</small></div>
            <div><span>03</span><strong>Trim unnecessary idling</strong><small>Stationary engine time adds avoidable emissions.</small></div>
          </div>
        </div>
        <div className="diagnosis-score-card">
          <MetricRing score={Math.round(Math.max(0, Math.min(100, ecoScore)))} />
          <div>
            <span className="panel-eyebrow">OPTIMIZATION READINESS</span>
            <strong>Good opportunity</strong>
            <p>There is visible room to lower the current carbon intensity.</p>
          </div>
        </div>
      </section>

      <section className="comparison-section">
        <div className="section-title-block centered-title">
          <span className="panel-eyebrow">CURRENT → OPTIMIZED</span>
          <h2>See the difference a smarter journey can make.</h2>
          <p>The visual comparison is connected to the local EcoDrive analysis pipeline when you run Live analysis.</p>
        </div>

        <div className="comparison-stage">
          <div className="comparison-card current-card">
            <div className="comparison-orb orb-red" />
            <span>CURRENT PATH</span>
            <strong>{co2GPerKm.toFixed(0)}</strong>
            <em>g/km</em>
            <div className="comparison-meter"><i style={{ width: `${Math.min(100, Math.max(5, co2GPerKm / 1.5))}%` }} /></div>
            <small>Current backend carbon intensity</small>
          </div>

          <div className="comparison-arrow">
            <div className="arrow-core"><ArrowRight size={22} /></div>
            <span>AI OPTIMIZATION</span>
            <small>behavior + fuel + route</small>
          </div>

          <div className="comparison-card optimized-card">
            <div className="comparison-orb orb-green" />
            <span>OPTIMIZED PATH</span>
            <strong>{Math.max(0, co2GPerKm * 0.8).toFixed(0)}</strong>
            <em>g/km</em>
            <div className="comparison-meter"><i style={{ width: `${Math.min(100, Math.max(5, (co2GPerKm * 0.8) / 1.5))}%` }} /></div>
            <small>Illustrative optimization target</small>
          </div>

          <div className="comparison-reduction">
            <MoveDownRight size={17} />
            <strong>{Math.max(0, co2GPerKm * 0.2).toFixed(0)} g/km</strong>
            <span>potential reduction</span>
          </div>
        </div>
      </section>

      <section className="impact-banner">
        <div
          className="impact-image"
          style={{ backgroundImage: `url(${forestTopBg})` }}
        />
        <div className="impact-overlay" />
        <div className="impact-content">
          <span className="panel-eyebrow">THE BIGGER PICTURE</span>
          <h2>Every efficient kilometre<br /><span>compounds into impact.</span></h2>
          <p>
            Cleaner trips are not one single action. They are the result of many small decisions working together.
          </p>
          <button
            type="button"
            className="impact-button"
            onClick={() => navigate("/assistant")}
          >
            Explore AI recommendations
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="impact-quote">
          <Leaf size={23} />
          <p>Cleaner vehicles.<br />Smarter drivers.<br /><strong>A greener tomorrow.</strong></p>
        </div>
      </section>

      <footer className="carbon-page-footer">
        <span>ECODRIVE AI · EMISSIONS INTELLIGENCE</span>
        <span>{backendOnline ? "LIVE LOCAL PIPELINE · CARBON IMPACT CONNECTED" : "BACKEND OFFLINE · SHOWING SAFE DEMO VALUES"}</span>
      </footer>
    </div>
  );
}
