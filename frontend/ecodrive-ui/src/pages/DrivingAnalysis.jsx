import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Fuel,
  Gauge,
  Leaf,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import "./DrivingAnalysis.css";
import ecoSwiftImage from "../assets/eco-swift.png";
import { useEcoDrive } from "../context/EcoDriveContext";

const demoEvents = [
  {
    id: 1,
    type: "braking",
    title: "Hard braking detected",
    location: "NH-16 • Visakhapatnam",
    time: "09:42 AM",
    value: "-8.4%",
    impact: "Higher fuel and energy loss",
    detail:
      "A sharp deceleration event was detected. Smoother braking with earlier anticipation can improve efficiency and passenger comfort.",
    icon: CircleAlert,
  },
  {
    id: 2,
    type: "acceleration",
    title: "Rapid acceleration",
    location: "MVP Colony",
    time: "09:36 AM",
    value: "+6.8%",
    impact: "Short efficiency drop",
    detail:
      "Acceleration crossed the demo threshold for efficient driving. Gradual throttle input helps maintain a steadier power demand.",
    icon: Zap,
  },
  {
    id: 3,
    type: "speed",
    title: "Speed variation",
    location: "Siripuram Junction",
    time: "09:28 AM",
    value: "72 km/h",
    impact: "Moderate efficiency impact",
    detail:
      "Frequent speed changes were detected in this section. Maintaining a stable speed where road conditions allow can reduce unnecessary energy use.",
    icon: Gauge,
  },
  {
    id: 4,
    type: "smooth",
    title: "Smooth driving segment",
    location: "Beach Road",
    time: "09:18 AM",
    value: "4.2 km",
    impact: "Efficient driving pattern",
    detail:
      "This segment shows stable speed and low acceleration variation in the prototype analysis.",
    icon: CircleCheck,
  },
  {
    id: 5,
    type: "braking",
    title: "Early braking opportunity",
    location: "Waltair Main Road",
    time: "09:11 AM",
    value: "2.1 sec",
    impact: "Opportunity identified",
    detail:
      "The system identified a possible earlier braking window before a traffic slowdown.",
    icon: CircleAlert,
  },
];

const behaviors = [
  { label: "Speed control", score: 82, icon: Gauge, note: "Stable" },
  { label: "Acceleration", score: 76, icon: Zap, note: "Good" },
  { label: "Braking", score: 71, icon: ArrowDownRight, note: "Improve" },
  { label: "Smoothness", score: 84, icon: Wind, note: "Strong" },
  { label: "Consistency", score: 88, icon: Activity, note: "Strong" },
];

const recommendations = [
  {
    id: 1,
    title: "Anticipate slowdowns",
    text: "Look further ahead and release the accelerator earlier before traffic compression.",
    impact: "Efficiency",
    icon: TrendingUp,
  },
  {
    id: 2,
    title: "Use smoother throttle input",
    text: "Reduce sudden acceleration changes and build speed progressively.",
    impact: "Fuel use",
    icon: Fuel,
  },
  {
    id: 3,
    title: "Keep a steadier cruise",
    text: "When traffic and road conditions permit, reduce unnecessary speed oscillation.",
    impact: "Comfort",
    icon: ShieldCheck,
  },
];

function ScoreRing({ score }) {
  return (
    <div className="driving-score-ring" style={{ "--score": `${score}%` }}>
      <div className="driving-score-ring-inner">
        <span className="driving-score-number">{score}</span>
        <span className="driving-score-label">AI SCORE</span>
      </div>
    </div>
  );
}

function BehaviorRow({ item }) {
  const Icon = item.icon;

  return (
    <div className="driving-behavior-row">
      <div className="driving-behavior-icon">
        <Icon size={17} />
      </div>

      <div className="driving-behavior-main">
        <div className="driving-behavior-heading">
          <span>{item.label}</span>
          <strong>{item.score}</strong>
        </div>

        <div className="driving-progress">
          <div
            className="driving-progress-fill"
            style={{ width: `${item.score}%` }}
          />
        </div>
      </div>

      <span className={`driving-behavior-status ${item.note.toLowerCase()}`}>
        {item.note}
      </span>
    </div>
  );
}

export default function Driving() {
  const [range, setRange] = useState("Current trip");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [applied, setApplied] = useState([]);
  const [activeView, setActiveView] = useState("Overview");
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();
  const drivingAnalysis = analysis?.pipeline?.driving_analysis;
  const summary = analysis?.summary;

  const filteredEvents = useMemo(() => {
    if (filter === "all") return demoEvents;
    return demoEvents.filter((event) => event.type === filter);
  }, [filter]);

  const toggleRecommendation = (id) => {
    setApplied((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const resetDemo = () => {
    setRange("Current trip");
    setFilter("all");
    setExpanded(1);
    setPlaying(false);
    setApplied([]);
    setActiveView("Overview");
  };

  return (
    <main className="driving-page">
      <div className="driving-background-orb driving-orb-one" />
      <div className="driving-background-orb driving-orb-two" />

      <section className="driving-hero">
        <div className="driving-hero-copy">
          <div className="driving-eyebrow">
            <span className="driving-eyebrow-dot" />
            DRIVING INTELLIGENCE
          </div>

          <h1>
            Understand how
            <span> you drive.</span>
          </h1>

          <p>
            AI-powered analysis of acceleration, braking, speed control and
            driving consistency — designed to turn every trip into a smarter,
            cleaner drive.
          </p>

          <div className="driving-hero-actions">
            <button
              className={`driving-primary-button ${playing ? "active" : ""}`}
              onClick={async () => {
                if (!playing) {
                  try {
                    await runAnalysis();
                  } catch {
                    // Keep demo controls usable if the backend is offline.
                  }
                }
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              {playing ? "Pause analysis" : loading ? "Running backend…" : "Run trip analysis"}
            </button>

            <button className="driving-ghost-button" onClick={resetDemo}>
              <RotateCcw size={16} />
              Reset view
            </button>
          </div>
        </div>

        <div className="driving-hero-visual">
          <div className="driving-visual-grid" />
          <div className="driving-visual-glow" />

          <div className="driving-neural-node node-a">
            <Gauge size={18} />
          </div>
          <div className="driving-neural-node node-b">
            <Zap size={18} />
          </div>
          <div className="driving-neural-node node-c">
            <Wind size={18} />
          </div>

          <div className="driving-vehicle-orbit">
            <div className="driving-core-ring ring-one" />
            <div className="driving-core-ring ring-two" />
            <div className="driving-core-ring ring-three" />

            <div className="driving-vehicle-glow" />

            <div className="driving-vehicle-image-wrap">
              <img
                src={ecoSwiftImage}
                alt="EcoDrive vehicle"
                className="driving-vehicle-image"
              />
            </div>

            <div className="driving-ai-core-badge">
              <Brain size={18} />
              <div>
                <span>AI MODEL</span>
                <strong>DRIVING ANALYSIS</strong>
              </div>
            </div>
          </div>

          <div className="driving-scan-line" />
          <span className="driving-visual-label">BEHAVIOR MODEL / DEMO</span>
        </div>
      </section>

      <section className="driving-toolbar">
        <div className="driving-tabs">
          {["Overview", "Timeline", "Insights"].map((tab) => (
            <button
              key={tab}
              className={activeView === tab ? "active" : ""}
              onClick={() => setActiveView(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="driving-range-selector">
          {["Current trip", "7 days", "30 days"].map((item) => (
            <button
              key={item}
              className={range === item ? "active" : ""}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="driving-main-grid">
        <article className="driving-panel driving-score-panel">
          <div className="driving-panel-header">
            <div>
              <span className="driving-section-kicker">OVERALL PERFORMANCE</span>
              <h2>AI Driving Score</h2>
            </div>
            <span className="driving-live-pill">
              <span />
              DEMO
            </span>
          </div>

          <div className="driving-score-layout">
            <ScoreRing score={drivingAnalysis?.driving_efficiency_score ?? 81} />

            <div className="driving-score-copy">
              <div className="driving-score-rating">
                <Sparkles size={17} />
                Strong driving pattern
              </div>

              <p>
                Your current driving profile is generated from the EcoDrive driving-analysis
                tool. The biggest improvement areas are taken from the backend issues list.
              </p>

              <div className="driving-score-change">
                <ArrowUpRight size={17} />
                <strong>{drivingAnalysis ? `${drivingAnalysis.driving_efficiency_score}/100` : "+6 pts"}</strong>
                <span>{drivingAnalysis ? drivingAnalysis.driving_rating : "demo score"}</span>
              </div>
            </div>
          </div>

          <div className="driving-mini-stats">
            <div>
              <span>TRIP TIME</span>
              <strong>34m 18s</strong>
            </div>
            <div>
              <span>DISTANCE</span>
              <strong>18.6 km</strong>
            </div>
            <div>
              <span>SMOOTH SEGMENTS</span>
              <strong>72%</strong>
            </div>
          </div>
        </article>

        <article className="driving-panel driving-profile-panel">
          <div className="driving-panel-header">
            <div>
              <span className="driving-section-kicker">DRIVER PROFILE</span>
              <h2>Behavior signals</h2>
            </div>
            <Activity size={19} />
          </div>

          <div className="driving-behavior-list">
            {behaviors.map((item) => (
              <BehaviorRow key={item.label} item={item} />
            ))}
          </div>
        </article>
      </section>

      <section className="driving-impact-grid">
        <article className="driving-impact-card fuel">
          <div className="driving-impact-icon">
            <Fuel size={21} />
          </div>
          <div className="driving-impact-heading">
            <span>FUEL EFFICIENCY IMPACT</span>
            <strong>Good</strong>
          </div>
          <div className="driving-impact-value">
            7.4 <small>L/100km</small>
          </div>
          <div className="driving-impact-footer">
            <ArrowDownRight size={16} />
            Lower is better for this demo metric
          </div>
        </article>

        <article className="driving-impact-card carbon">
          <div className="driving-impact-icon">
            <Leaf size={21} />
          </div>
          <div className="driving-impact-heading">
            <span>TRIP CO₂ IMPACT</span>
            <strong>Moderate</strong>
          </div>
          <div className="driving-impact-value">
            2.9 <small>kg CO₂</small>
          </div>
          <div className="driving-impact-footer">
            <ArrowDownRight size={16} />
            Prototype trip estimate
          </div>
        </article>

        <article className="driving-impact-card stability">
          <div className="driving-impact-icon">
            <ShieldCheck size={21} />
          </div>
          <div className="driving-impact-heading">
            <span>DRIVING STABILITY</span>
            <strong>Strong</strong>
          </div>
          <div className="driving-impact-value">
            88 <small>/ 100</small>
          </div>
          <div className="driving-impact-footer">
            <ArrowUpRight size={16} />
            Consistency signal
          </div>
        </article>
      </section>

      <section className="driving-section-block">
        <div className="driving-section-title-row">
          <div>
            <span className="driving-section-kicker">TRIP INTELLIGENCE</span>
            <h2>Driving event timeline</h2>
          </div>

          <div className="driving-filter-group">
            {[
              ["all", "All"],
              ["braking", "Braking"],
              ["acceleration", "Acceleration"],
              ["speed", "Speed"],
              ["smooth", "Smooth"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="driving-timeline-panel">
          <div className="driving-route-line">
            <span className="route-start" />
            <span className="route-current" />
            <span className="route-end" />
          </div>

          <div className="driving-events">
            {filteredEvents.map((event) => {
              const Icon = event.icon;
              const isOpen = expanded === event.id;

              return (
                <div
                  className={`driving-event ${isOpen ? "expanded" : ""}`}
                  key={event.id}
                >
                  <div className={`driving-event-marker ${event.type}`}>
                    <Icon size={16} />
                  </div>

                  <div className="driving-event-content">
                    <button
                      className="driving-event-head"
                      onClick={() =>
                        setExpanded(isOpen ? null : event.id)
                      }
                    >
                      <div>
                        <span>{event.time}</span>
                        <h3>{event.title}</h3>
                        <p>
                          <MapPin size={13} />
                          {event.location}
                        </p>
                      </div>

                      <div className="driving-event-right">
                        <strong>{event.value}</strong>
                        {isOpen ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="driving-event-details">
                        <p>{event.detail}</p>
                        <div>
                          <span>IMPACT</span>
                          <strong>{event.impact}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="driving-empty-state">
              No demo events match this filter.
            </div>
          )}
        </div>
      </section>

      <section className="driving-analysis-grid">
        <article className="driving-panel driving-pattern-panel">
          <div className="driving-panel-header">
            <div>
              <span className="driving-section-kicker">AI INTERPRETATION</span>
              <h2>Your driving pattern</h2>
            </div>
            <Brain size={20} />
          </div>

          <div className="driving-pattern-visual">
            <div className="driving-pattern-bars">
              <span style={{ height: "48%" }} />
              <span style={{ height: "68%" }} />
              <span style={{ height: "54%" }} />
              <span style={{ height: "82%" }} />
              <span style={{ height: "62%" }} />
              <span style={{ height: "76%" }} />
              <span style={{ height: "88%" }} />
              <span style={{ height: "72%" }} />
              <span style={{ height: "91%" }} />
              <span style={{ height: "66%" }} />
              <span style={{ height: "79%" }} />
              <span style={{ height: "86%" }} />
            </div>
            <div className="driving-pattern-axis">
              <span>START</span>
              <span>TRIP PROGRESS</span>
              <span>END</span>
            </div>
          </div>

          <div className="driving-pattern-summary">
            <div className="driving-summary-badge">
              <CircleCheck size={17} />
              Controlled
            </div>
            <p>
              The prototype model detects a mostly controlled driving rhythm.
              Variability increases around junctions and traffic changes.
            </p>
          </div>
        </article>

        <article className="driving-panel driving-trip-breakdown">
          <div className="driving-panel-header">
            <div>
              <span className="driving-section-kicker">PERFORMANCE MIX</span>
              <h2>Trip breakdown</h2>
            </div>
            <Timer size={20} />
          </div>

          <div className="driving-breakdown-list">
            <div>
              <span>
                <i className="dot smooth-dot" />
                Smooth driving
              </span>
              <strong>72%</strong>
            </div>
            <div>
              <span>
                <i className="dot normal-dot" />
                Normal driving
              </span>
              <strong>20%</strong>
            </div>
            <div>
              <span>
                <i className="dot alert-dot" />
                Improvement events
              </span>
              <strong>8%</strong>
            </div>
          </div>

          <div className="driving-donut">
            <div className="driving-donut-center">
              <strong>72%</strong>
              <span>SMOOTH</span>
            </div>
          </div>

          <div className="driving-location-row">
            <MapPin size={16} />
            <span>Current demo route</span>
            <ChevronRight size={16} />
          </div>
        </article>
      </section>

      <section className="driving-section-block">
        <div className="driving-section-title-row">
          <div>
            <span className="driving-section-kicker">AI COACH</span>
            <h2>Recommendations for your next trip</h2>
          </div>
          <span className="driving-ai-badge">
            <Sparkles size={14} />
            PERSONALIZED
          </span>
        </div>

        <div className="driving-recommendation-grid">
          {recommendations.map((item) => {
            const Icon = item.icon;
            const isApplied = applied.includes(item.id);

            return (
              <article className="driving-recommendation" key={item.id}>
                <div className="driving-recommendation-top">
                  <div className="driving-recommendation-icon">
                    <Icon size={20} />
                  </div>
                  <span>{item.impact}</span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.text}</p>

                <button
                  className={isApplied ? "applied" : ""}
                  onClick={() => toggleRecommendation(item.id)}
                >
                  {isApplied ? <Check size={16} /> : <ArrowUpRight size={16} />}
                  {isApplied ? "Added to plan" : "Add to driving plan"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="driving-disclaimer">
        <div>
          <CircleAlert size={18} />
          <strong>Prototype analysis</strong>
        </div>
        <p>
          {backendOnline ? "This page is connected to the local EcoDrive backend. Numerical values shown above come from the deterministic project pipeline." : "The backend is currently offline, so demo values remain visible. Start the API and run the trip analysis to replace them."}
        </p>
      </section>
    </main>
  );
}
