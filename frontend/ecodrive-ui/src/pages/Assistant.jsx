import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CarFront,
  Check,
  Gauge,
  Leaf,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./Assistant.css";
import { useEcoDrive } from "../context/EcoDriveContext";
import { chatWithEcoDriveAgent } from "../services/api";

const efficiencyData = [
  { distance: 0, predicted: 5, actual: 4 },
  { distance: 10, predicted: 8, actual: 6 },
  { distance: 20, predicted: 15, actual: 12 },
  { distance: 30, predicted: 13, actual: 15 },
  { distance: 40, predicted: 19, actual: 14 },
  { distance: 50, predicted: 27, actual: 18 },
];

const factors = [
  { name: "Speed", value: 32, icon: Gauge },
  { name: "Acceleration", value: 24, icon: Zap },
  { name: "Traffic", value: 18, icon: Activity },
  { name: "AC Usage", value: 14, icon: Sparkles },
  { name: "Vehicle Load", value: 8, icon: CarFront },
  { name: "Road Type", value: 4, icon: Leaf },
];

const modes = [
  {
    title: "Current Drive",
    value: "17.8",
    subtitle: "Current driving pattern",
  },
  {
    title: "Eco Mode",
    value: "20.4",
    subtitle: "Steadier acceleration + speed",
  },
  {
    title: "Best Scenario",
    value: "23.6",
    subtitle: "AI optimized conditions",
  },
];

const resultCardStyle = {
  border: "1px solid rgba(82,230,174,.20)",
  background:
    "linear-gradient(135deg, rgba(10,39,37,.96), rgba(5,24,26,.94))",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 18px 60px rgba(0,0,0,.22)",
};

const resultMetricStyle = {
  border: "1px solid rgba(140,190,185,.12)",
  background: "rgba(255,255,255,.025)",
  borderRadius: "16px",
  padding: "18px",
};

export default function Assistant() {
  const location = useLocation();
  const [selectedMode, setSelectedMode] = useState(1);
  const [showDemo, setShowDemo] = useState(false);
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I’m your EcoDrive AI Assistant. Ask me about fuel consumption, driving behavior, route choice, CO₂ emissions, or how to improve your eco score.",
      time: "Ready",
    },
  ]);

  const assistantSuggestions = useMemo(
    () => [
      "How can I reduce my fuel consumption?",
      "What is my current CO₂ impact?",
      "Which route is better for my trip?",
      "How can I improve my eco score?",
    ],
    []
  );

  const sendChat = async (presetMessage = "") => {
    const message = (presetMessage || chatInput).trim();
    if (!message || chatLoading) return;

    setChatError("");
    setChatInput("");
    setChatMessages((messages) => [
      ...messages,
      { role: "user", text: message, time: "Now" },
    ]);
    setChatLoading(true);

    try {
      const result = await chatWithEcoDriveAgent({
        message,
        analysis,
        context: {
          pipeline: analysis?.pipeline || {},
        },
      });
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          text: result?.reply || "I could not generate a response right now.",
          time: result?.source === "gemini" ? "AI" : "EcoDrive",
        },
      ]);
    } catch (error) {
      setChatError(error.message || "Unable to connect to EcoDrive Assistant.");
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          text: "I couldn’t reach the assistant service. Your EcoDrive analysis is still available.",
          time: "Offline",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const currentMode = modes[selectedMode];
  const fuelPrediction = analysis?.pipeline?.fuel_prediction;
  const carbonImpact = analysis?.pipeline?.carbon_impact;
  const summary = analysis?.pipeline?.summary || analysis?.summary;
  const ecoPerformance = analysis?.pipeline?.eco_performance;

  const hasFuelResult = Boolean(
    fuelPrediction &&
      !fuelPrediction.error &&
      fuelPrediction.predicted_fuel_consumption_l_per_100km != null
  );

  const predictedFuel = hasFuelResult
    ? Number(fuelPrediction.predicted_fuel_consumption_l_per_100km)
    : null;

  const predictedEfficiency = hasFuelResult
    ? Number(fuelPrediction.equivalent_fuel_efficiency_kmpl)
    : null;

  const tripCo2PerKm = carbonImpact?.co2_per_km;
  const tripCo2Kg = carbonImpact?.estimated_co2_emissions_kg;
  const tripFuelLitres = carbonImpact?.estimated_fuel_consumed_litres;

  const displayedEfficiency = useMemo(() => {
    if (predictedEfficiency != null && Number.isFinite(predictedEfficiency)) {
      return predictedEfficiency.toFixed(2);
    }
    return currentMode.value;
  }, [predictedEfficiency, currentMode.value]);

  const displayedFuel = useMemo(() => {
    if (predictedFuel != null && Number.isFinite(predictedFuel)) {
      return predictedFuel.toFixed(2);
    }
    return "—";
  }, [predictedFuel]);

  const displayedEmissions = useMemo(() => {
    if (tripCo2PerKm != null && Number.isFinite(Number(tripCo2PerKm))) {
      return `${(Number(tripCo2PerKm) * 1000).toFixed(0)} g/km`;
    }
    return "—";
  }, [tripCo2PerKm]);

  const runPrediction = async () => {
    setShowDemo(true);
    await runAnalysis();
  };

  return (
    <main className="ai-predictions-page">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="ai-hero">
        <div className="ai-hero-background" />

        <div className="ai-hero-content">
          <div className="ai-powered-badge">
            <Sparkles size={14} />
            AI POWERED
          </div>

          <h1>
            AI <span>Predictions</span>
          </h1>

          <h2>
            Predict. Optimize. <span>Drive Smarter.</span>
          </h2>

          <p>
            Our AI analyzes your vehicle, driving behavior and trip conditions
            to predict fuel consumption and emissions — helping you make
            cleaner, smarter decisions on every journey.
          </p>

          <div className="ai-hero-buttons">
            <button
              className="ai-green-button"
              type="button"
              onClick={runPrediction}
              disabled={loading}
            >
              <Play size={15} fill="currentColor" />
              {loading ? "Analyzing…" : showDemo ? "Run Prediction Again" : "Watch Demo"}
            </button>

            <button
              className="ai-outline-button"
              type="button"
              onClick={() =>
                document
                  .getElementById("ai-workspace")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See How It Works
              <ArrowRight size={16} />
            </button>
          </div>

          {showDemo && (
            <div className="demo-panel">
              <div className="demo-icon">
                <BrainCircuit size={20} />
              </div>
              <div>
                <strong>EcoDrive prediction flow</strong>
                <span>
                  Vehicle data → Driving behavior → ML prediction → Emissions
                  estimate → Optimization. Current model: Gradient Boosting
                  Regressor.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            AI INTELLIGENCE VISUAL
            Vehicle preview / front / side / rear controls
            intentionally removed.
        ================================================== */}
        <div className="ai-intelligence-visual">
          <div className="ai-visual-glow" />
          <div className="ai-orbit ai-orbit-a" />
          <div className="ai-orbit ai-orbit-b" />

          <div className="ai-core">
            <BrainCircuit size={58} />
            <span>AI ENGINE</span>
            <strong>EcoDrive Intelligence</strong>
          </div>

          <div className="ai-signal signal-speed">
            <Gauge size={17} />
            <span>Speed</span>
          </div>

          <div className="ai-signal signal-fuel">
            <Zap size={17} />
            <span>Fuel</span>
          </div>

          <div className="ai-signal signal-carbon">
            <Leaf size={17} />
            <span>CO₂</span>
          </div>

          <div className="ai-signal signal-route">
            <Activity size={17} />
            <span>Route</span>
          </div>

          <div className="ai-visual-caption">
            <span>LIVE INTELLIGENCE</span>
            <strong>Vehicle → Driving → ML → Carbon → Optimization</strong>
          </div>
        </div>

        <div className="hero-stat-stack">
          <div className="hero-stat-card">
            <div className="stat-icon">
              <Zap size={21} />
            </div>
            <div>
              <span>PREDICTED EFFICIENCY</span>
              <strong>{displayedEfficiency} km/L</strong>
              <small>{hasFuelResult ? "Backend ML" : "Run prediction"}</small>
            </div>
          </div>

          <div className="hero-stat-card">
            <div className="stat-icon">
              <Leaf size={21} />
            </div>
            <div>
              <span>PROJECTED EMISSIONS</span>
              <strong>{displayedEmissions}</strong>
              <small>{carbonImpact ? "Backend estimate" : "Run prediction"}</small>
            </div>
          </div>

          <div className="hero-stat-card">
            <div className="stat-icon">
              <Leaf size={21} />
            </div>
            <div>
              <span>EST. FUEL USE</span>
              <strong>{displayedFuel} L/100km</strong>
              <small>{hasFuelResult ? "ML prediction" : "Run prediction"}</small>
            </div>
          </div>
        </div>

        <div className="hero-mini-cards">
          <div>
            <strong>{hasFuelResult ? "ML" : "—"}</strong>
            <span>Prediction Active</span>
          </div>
          <div>
            <strong>
              {tripCo2PerKm != null
                ? `${(Number(tripCo2PerKm) * 1000).toFixed(0)}g`
                : "—"}
            </strong>
            <span>Carbon signal</span>
          </div>
          <div>
            <strong>{backendOnline ? "ML" : "OFF"}</strong>
            <span>{backendOnline ? "Backend Model" : "Backend Offline"}</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          ACTUAL BACKEND ML RESULT
      ====================================================== */}
      <section style={{ padding: "0 5% 28px" }}>
        <div style={resultCardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  fontWeight: 800,
                  color: "#56e6b0",
                  marginBottom: "8px",
                }}
              >
                ML PREDICTION RESULT
              </span>
              <h2 style={{ margin: 0, fontSize: "28px" }}>
                Fuel model output
              </h2>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#8ca9a7",
                  maxWidth: "720px",
                }}
              >
                This panel displays the actual fuel-prediction result returned
                by the EcoDrive backend after the trained model runs.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 13px",
                borderRadius: "999px",
                border: "1px solid rgba(82,230,174,.22)",
                color: backendOnline ? "#56e6b0" : "#ffad5c",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "currentColor",
                }}
              />
              {backendOnline ? "BACKEND CONNECTED" : "BACKEND OFFLINE"}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginTop: "22px",
            }}
          >
            <div style={resultMetricStyle}>
              <span style={{ color: "#718c8a", fontSize: "11px", letterSpacing: "1.4px" }}>
                PREDICTED FUEL CONSUMPTION
              </span>
              <strong style={{ display: "block", fontSize: "30px", marginTop: "8px" }}>
                {hasFuelResult ? predictedFuel.toFixed(3) : "—"}
              </strong>
              <small style={{ color: "#8ca9a7" }}>L / 100 km</small>
            </div>

            <div style={resultMetricStyle}>
              <span style={{ color: "#718c8a", fontSize: "11px", letterSpacing: "1.4px" }}>
                EQUIVALENT EFFICIENCY
              </span>
              <strong style={{ display: "block", fontSize: "30px", marginTop: "8px" }}>
                {hasFuelResult ? predictedEfficiency.toFixed(3) : "—"}
              </strong>
              <small style={{ color: "#8ca9a7" }}>km / L</small>
            </div>

            <div style={resultMetricStyle}>
              <span style={{ color: "#718c8a", fontSize: "11px", letterSpacing: "1.4px" }}>
                ML MODEL
              </span>
              <strong style={{ display: "block", fontSize: "19px", marginTop: "12px", color: "#56e6b0" }}>
                {fuelPrediction?.model || "Gradient Boosting Regressor"}
              </strong>
              <small style={{ color: "#8ca9a7" }}>Trained project model</small>
            </div>

            <div style={resultMetricStyle}>
              <span style={{ color: "#718c8a", fontSize: "11px", letterSpacing: "1.4px" }}>
                TRIP DISTANCE
              </span>
              <strong style={{ display: "block", fontSize: "30px", marginTop: "8px" }}>
                {fuelPrediction?.distance_km ?? "—"}
              </strong>
              <small style={{ color: "#8ca9a7" }}>km</small>
            </div>
          </div>

          {hasFuelResult && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "10px",
                marginTop: "14px",
              }}
            >
              <div style={resultMetricStyle}>
                <span style={{ color: "#718c8a", fontSize: "10px", letterSpacing: "1.2px" }}>
                  SPEED INPUT
                </span>
                <strong style={{ display: "block", marginTop: "6px" }}>
                  {fuelPrediction.input_speed_kmh} km/h
                </strong>
              </div>
              <div style={resultMetricStyle}>
                <span style={{ color: "#718c8a", fontSize: "10px", letterSpacing: "1.2px" }}>
                  TRAFFIC
                </span>
                <strong style={{ display: "block", marginTop: "6px", textTransform: "capitalize" }}>
                  {fuelPrediction.traffic_level}
                </strong>
              </div>
              <div style={resultMetricStyle}>
                <span style={{ color: "#718c8a", fontSize: "10px", letterSpacing: "1.2px" }}>
                  AC USAGE
                </span>
                <strong style={{ display: "block", marginTop: "6px", textTransform: "capitalize" }}>
                  {fuelPrediction.ac_usage}
                </strong>
              </div>
              <div style={resultMetricStyle}>
                <span style={{ color: "#718c8a", fontSize: "10px", letterSpacing: "1.2px" }}>
                  VEHICLE LOAD
                </span>
                <strong style={{ display: "block", marginTop: "6px", textTransform: "capitalize" }}>
                  {fuelPrediction.vehicle_load}
                </strong>
              </div>
              <div style={resultMetricStyle}>
                <span style={{ color: "#718c8a", fontSize: "10px", letterSpacing: "1.2px" }}>
                  ROAD TYPE
                </span>
                <strong style={{ display: "block", marginTop: "6px", textTransform: "capitalize" }}>
                  {fuelPrediction.road_type}
                </strong>
              </div>
            </div>
          )}

          {hasFuelResult && fuelPrediction.note && (
            <div
              style={{
                marginTop: "16px",
                padding: "13px 15px",
                borderRadius: "13px",
                border: "1px solid rgba(255,173,92,.18)",
                background: "rgba(255,173,92,.035)",
                color: "#a9b9b6",
                fontSize: "12px",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#ffad5c", marginRight: "8px" }}>
                Prototype ML estimate
              </strong>
              {fuelPrediction.note}
            </div>
          )}

          {analysis && (
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "18px",
                flexWrap: "wrap",
                color: "#8ca9a7",
                fontSize: "12px",
              }}
            >
              <span>Trip fuel: {tripFuelLitres != null ? `${tripFuelLitres} L` : "—"}</span>
              <span>Trip CO₂: {tripCo2Kg != null ? `${tripCo2Kg} kg` : "—"}</span>
              <span>
                Eco score: {ecoPerformance?.overall_score ?? summary?.eco_performance_score ?? "—"}/100
              </span>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          ECO DRIVE AI ASSISTANT
      ====================================================== */}
      <section className="eco-assistant-section" id="eco-assistant">
        <div className="eco-assistant-heading">
          <div>
            <div className="eco-assistant-kicker">
              <BrainCircuit size={15} />
              ECO DRIVE AI ASSISTANT
            </div>
            <h2>Your personal driving intelligence.</h2>
            <p>
              Ask questions about your current trip and get answers using the
              latest EcoDrive vehicle, driving, fuel, route and carbon analysis.
            </p>
          </div>
          <div className={`assistant-status ${backendOnline ? "online" : "offline"}`}>
            <span />
            {backendOnline ? "Backend connected" : "Backend offline"}
          </div>
        </div>

        <div className="eco-assistant-shell">
          <div className="assistant-chat-topbar">
            <div className="assistant-avatar"><BrainCircuit size={24} /></div>
            <div>
              <strong>EcoDrive AI</strong>
              <span>
                {summary
                  ? `Connected to your latest ${summary.eco_performance_score ?? "eco"} score analysis`
                  : "Connected to the EcoDrive intelligence layer"}
              </span>
            </div>
            <div className="assistant-live-pill"><i /> AI READY</div>
          </div>

          <div className="assistant-chat-body">
            <div className="assistant-chat-messages">
              {chatMessages.map((message, index) => (
                <div className={`assistant-message-row ${message.role}`} key={`${message.role}-${index}`}>
                  {message.role === "assistant" && (
                    <div className="assistant-message-avatar"><BrainCircuit size={16} /></div>
                  )}
                  <div className="assistant-message-bubble">
                    <span>{message.text}</span>
                    <small>{message.time}</small>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="assistant-message-row assistant">
                  <div className="assistant-message-avatar"><BrainCircuit size={16} /></div>
                  <div className="assistant-message-bubble typing-bubble">
                    <span className="typing-dots"><i /><i /><i /></span>
                    <small>Thinking with your EcoDrive data…</small>
                  </div>
                </div>
              )}
            </div>

            <aside className="assistant-context-panel">
              <div className="assistant-context-label">CURRENT ECO CONTEXT</div>
              <div className="assistant-context-score">
                <strong>{summary?.eco_performance_score ?? "—"}</strong>
                <span>/100 eco score</span>
              </div>
              <div className="assistant-context-grid">
                <div>
                  <span>Fuel</span>
                  <strong>
                    {analysis?.pipeline?.fuel_prediction?.predicted_fuel_consumption_l_per_100km ?? "—"}
                    {analysis?.pipeline?.fuel_prediction?.predicted_fuel_consumption_l_per_100km != null && " L/100km"}
                  </strong>
                </div>
                <div>
                  <span>CO₂</span>
                  <strong>
                    {analysis?.pipeline?.carbon_impact?.co2_emissions_kg ?? "—"}
                    {analysis?.pipeline?.carbon_impact?.co2_emissions_kg != null && " kg"}
                  </strong>
                </div>
                <div>
                  <span>Driving</span>
                  <strong>
                    {analysis?.pipeline?.driving_analysis?.driving_efficiency_score ?? "—"}
                    {analysis?.pipeline?.driving_analysis?.driving_efficiency_score != null && "/100"}
                  </strong>
                </div>
                <div>
                  <span>Route</span>
                  <strong>{analysis?.pipeline?.route_comparison?.recommended_route ?? "—"}</strong>
                </div>
              </div>
            </aside>
          </div>

          <div className="assistant-suggestion-row">
            {assistantSuggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => sendChat(suggestion)} disabled={chatLoading}>
                <Sparkles size={13} /> {suggestion}
              </button>
            ))}
          </div>

          <div className="assistant-composer">
            <div className="assistant-input-wrap">
              <Sparkles size={18} />
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendChat();
                  }
                }}
                placeholder="Ask EcoDrive AI anything about your drive…"
                disabled={chatLoading}
              />
            </div>
            <button
              type="button"
              className="assistant-send-button"
              onClick={() => sendChat()}
              disabled={!chatInput.trim() || chatLoading}
              aria-label="Send message"
            >
              <ArrowRight size={19} />
            </button>
          </div>

          {chatError && <div className="assistant-chat-error">{chatError}</div>}
          <div className="assistant-chat-note">
            <Check size={13} /> Responses use your latest EcoDrive analysis. Prototype estimates remain clearly identified.
          </div>
        </div>
      </section>

      {/* =====================================================
          WORKSPACE
      ====================================================== */}
      <section className="ai-workspace" id="ai-workspace">
        <div className="section-heading">
          <div>
            <span>MODEL INTELLIGENCE</span>
            <h2>Prediction signals at a glance.</h2>
          </div>
          <p>
            Explore the visual factors behind the current prototype prediction.
          </p>
        </div>

        <div className="ai-dashboard-grid">
          <article className="ai-card driving-modes-card">
            <div className="card-title">
              <div>
                <span>DRIVING MODES</span>
                <h3>Choose a mode to see predictions</h3>
              </div>
              <CarFront size={19} />
            </div>

            <div className="mode-grid">
              {modes.map((mode, index) => (
                <button
                  type="button"
                  key={mode.title}
                  className={`mode-card ${
                    selectedMode === index ? "selected" : ""
                  }`}
                  onClick={() => setSelectedMode(index)}
                >
                  <div className="mode-icon">
                    {index === 0 && <CarFront size={25} />}
                    {index === 1 && <Leaf size={25} />}
                    {index === 2 && <Sparkles size={25} />}
                  </div>

                  <strong>{mode.title}</strong>
                  <b>
                    {mode.value}
                    <small> km/L</small>
                  </b>
                  <span>{mode.subtitle}</span>

                  {selectedMode === index && (
                    <i>
                      <Check size={13} />
                    </i>
                  )}
                </button>
              ))}
            </div>
          </article>

          <article className="ai-card chart-card">
            <div className="card-title">
              <div>
                <span>EFFICIENCY TREND</span>
                <h3>Predicted vs Actual</h3>
              </div>
              <Activity size={19} />
            </div>

            <div className="chart-legend">
              <span>
                <i className="predicted-dot" />
                Predicted
              </span>
              <span>
                <i className="actual-dot" />
                Actual
              </span>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyData}>
                  <CartesianGrid
                    stroke="rgba(140,190,185,.10)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="distance"
                    stroke="#708d8b"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis
                    stroke="#708d8b"
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#071b1d",
                      border: "1px solid rgba(82,230,174,.25)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    labelFormatter={(value) => `${value} km`}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#45e5a9"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#46aef5"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-label">Illustrative distance trend</div>
          </article>

          <article className="ai-card confidence-card">
            <div className="card-title">
              <div>
                <span>AI CONFIDENCE</span>
                <h3>Prediction confidence</h3>
              </div>
              <BrainCircuit size={19} />
            </div>

            <div className="confidence-content">
              <div className="confidence-ring">
                <div>
                  <strong>{hasFuelResult ? "ML" : "—"}</strong>
                  <span>Model</span>
                </div>
              </div>

              <div className="confidence-list">
                <p>
                  <Check size={14} />
                  Driving behavior analyzed
                </p>
                <p>
                  <Check size={14} />
                  Route conditions considered
                </p>
                <p>
                  <Check size={14} />
                  Vehicle parameters included
                </p>
                <p>
                  <Check size={14} />
                  Optimization ready
                </p>
              </div>
            </div>
          </article>

          <article className="ai-card factors-card">
            <div className="card-title">
              <div>
                <span>TOP INFLUENCING FACTORS</span>
                <h3>What affects the prediction?</h3>
              </div>
              <Sparkles size={19} />
            </div>

            <div className="factor-list">
              {factors.map((factor) => {
                const Icon = factor.icon;

                return (
                  <div className="factor-row" key={factor.name}>
                    <Icon size={15} />
                    <span>{factor.name}</span>
                    <div className="factor-bar">
                      <i style={{ width: `${factor.value}%` }} />
                    </div>
                    <b>{factor.value}%</b>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      {/* =====================================================
          BOTTOM CTA
      ====================================================== */}
      <section className="ai-bottom-cta">
        <div className="cta-copy">
          <Leaf size={29} />
          <div>
            <span>SMARTER PREDICTIONS TODAY.</span>
            <strong>A Cleaner Tomorrow.</strong>
          </div>
        </div>

        <button type="button" onClick={runPrediction} disabled={loading}>
          {loading ? "Analyzing…" : "Optimize My Drive"}
          <ArrowRight size={17} />
        </button>
      </section>

      <div className="ai-page-note">
        EcoDrive AI • {backendOnline ? "Backend connected" : "Backend offline"} •{" "}
        {analysis?.pipeline?.fuel_prediction?.model
          ? `Model: ${analysis.pipeline.fuel_prediction.model}`
          : "Run Watch Demo or Optimize My Drive to execute the local ML pipeline."}
      </div>
    </main>
  );
}
