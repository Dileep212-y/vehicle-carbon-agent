import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  CarFront,
  CheckCircle2,
  Gauge,
  Leaf,
  Minus,
  Navigation,
  Sparkles,
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
import "./Driving.css";
import { useEcoDrive } from "../context/EcoDriveContext";

const behaviorData = [
  { time: "08:00", smoothness: 72, efficiency: 68 },
  { time: "08:10", smoothness: 76, efficiency: 72 },
  { time: "08:20", smoothness: 69, efficiency: 67 },
  { time: "08:30", smoothness: 82, efficiency: 78 },
  { time: "08:40", smoothness: 88, efficiency: 84 },
  { time: "08:50", smoothness: 84, efficiency: 81 },
  { time: "09:00", smoothness: 91, efficiency: 88 },
];

function getDrivingRating(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

function buildBehaviorCards(driving) {
  const score = Number(driving?.driving_efficiency_score ?? 82);
  const accelerations = Number(driving?.hard_accelerations ?? 3);
  const brakings = Number(driving?.hard_brakings ?? 2);
  const idle = Number(driving?.idle_minutes ?? 5);
  const maxSpeed = Number(driving?.max_speed_kmh ?? 80);
  const averageSpeed = Number(driving?.average_speed_kmh ?? 45);

  const speedStability = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, maxSpeed - averageSpeed) * 0.7)));
  const accelerationScore = Math.max(0, Math.min(100, 100 - accelerations * 6));
  const brakingScore = Math.max(0, Math.min(100, 100 - brakings * 6));
  const idleScore = Math.max(0, Math.min(100, 100 - idle * 3));

  return [
    {
      title: "Speed Stability",
      value: String(speedStability),
      unit: "/100",
      label: getDrivingRating(speedStability),
      icon: Gauge,
      progress: speedStability,
    },
    {
      title: "Acceleration",
      value: String(accelerationScore),
      unit: "/100",
      label: getDrivingRating(accelerationScore),
      icon: Zap,
      progress: accelerationScore,
    },
    {
      title: "Braking Control",
      value: String(brakingScore),
      unit: "/100",
      label: getDrivingRating(brakingScore),
      icon: Activity,
      progress: brakingScore,
    },
    {
      title: "Idle Management",
      value: String(idleScore),
      unit: "/100",
      label: getDrivingRating(idleScore),
      icon: CarFront,
      progress: idleScore,
    },
  ];
}

const events = [
  {
    time: "09:02",
    title: "Hard acceleration",
    detail: "1.2 m/s² peak acceleration",
    severity: "Attention",
    icon: Zap,
  },
  {
    time: "08:47",
    title: "Stable cruising",
    detail: "Maintained 54–62 km/h",
    severity: "Positive",
    icon: Gauge,
  },
  {
    time: "08:31",
    title: "Extended idle",
    detail: "3.4 minutes stationary",
    severity: "Attention",
    icon: Activity,
  },
  {
    time: "08:18",
    title: "Smooth braking",
    detail: "Controlled deceleration",
    severity: "Positive",
    icon: CheckCircle2,
  },
];

export default function Driving() {
  const [activeTab, setActiveTab] = useState("Overview");
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();
  const [tipOpen, setTipOpen] = useState(false);

  const driving = analysis?.pipeline?.driving_analysis;
  const overallScore = Number(driving?.driving_efficiency_score ?? 82);
  const drivingRating = driving?.driving_rating || getDrivingRating(overallScore);
  const behaviorCards = useMemo(() => buildBehaviorCards(driving), [driving]);
  const averageSpeed = Number(driving?.average_speed_kmh ?? 45);
  const maxSpeed = Number(driving?.max_speed_kmh ?? 80);
  const hardAccelerations = Number(driving?.hard_accelerations ?? 3);
  const hardBrakings = Number(driving?.hard_brakings ?? 2);
  const idleMinutes = Number(driving?.idle_minutes ?? 5);
  const acUsage = driving?.ac_usage || "moderate";
  const trafficLevel = driving?.traffic_level || "moderate";
  const vehicleLoad = driving?.vehicle_load || "normal";
  const issues = Array.isArray(driving?.issues) ? driving.issues : [];
  const primaryIssue = issues.find((issue) => !issue.includes("No major")) || "No major driving-efficiency issue detected.";

  return (
    <main className="driving-page">
      <section className="driving-hero">
        <div className="driving-hero-bg" />

        <div className="driving-hero-copy">
          <div className="driving-kicker">
            <span />
            DRIVING INTELLIGENCE
          </div>

          <h1>
            Your driving
            <span>has a signature.</span>
          </h1>

          <p>
            EcoDrive AI turns speed, acceleration, braking and idle behavior
            into a clear picture of how efficiently you drive.
          </p>

          <div className="driving-actions">
            <button
              type="button"
              className="driving-primary"
              onClick={async () => {
                try {
                  await runAnalysis();
                } catch {
                  // Keep the strategy view available when backend is offline.
                }
                document
                  .getElementById("driving-analysis")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Analysis
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="driving-secondary"
              onClick={() => setTipOpen((v) => !v)}
            >
              <Sparkles size={15} />
              {tipOpen ? "Hide AI Tip" : "AI Driving Tip"}
            </button>
          </div>

          {tipOpen && (
            <div className="driving-tip">
              <div>
                <Leaf size={19} />
              </div>
              <p>
                A steadier speed profile and fewer abrupt acceleration events
                can support better fuel efficiency.
              </p>
            </div>
          )}
        </div>

        <div className="driving-score-zone">
          <div className="score-halo halo-one" />
          <div className="score-halo halo-two" />

          <div className="driving-score">
            <div className="score-ring">
              <svg viewBox="0 0 220 220">
                <circle className="score-track" cx="110" cy="110" r="88" />
                <circle
                  className="score-progress"
                  cx="110"
                  cy="110"
                  r="88"
                  pathLength="100"
                  strokeDasharray={`${overallScore} ${100 - overallScore}`}
                />
              </svg>

              <div className="score-center">
                <span>DRIVING</span>
                <strong>{overallScore}</strong>
                <small>{drivingRating}</small>
              </div>
            </div>
          </div>

          <div className="score-floating-card">
            <Leaf size={18} />
            <div>
              <span>ECO IMPACT</span>
              <strong>{issues.length ? primaryIssue : "Low emission pattern"}</strong>
            </div>
          </div>
        </div>

        <div className="hero-metrics">
          <div>
            <span>AVERAGE SPEED</span>
            <strong>{averageSpeed} <small>km/h</small></strong>
          </div>
          <div>
            <span>HARD ACCELERATIONS</span>
            <strong>{hardAccelerations}</strong>
          </div>
          <div>
            <span>HARD BRAKINGS</span>
            <strong>{hardBrakings}</strong>
          </div>
          <div>
            <span>IDLE TIME</span>
            <strong>{idleMinutes} <small>min</small></strong>
          </div>
        </div>
      </section>

      <section className="driving-content" id="driving-analysis">
        <div className="driving-heading">
          <div>
            <span>BEHAVIOR ANALYTICS</span>
            <h2>Read your driving pattern.</h2>
          </div>

          <div className="driving-tabs">
            {["Overview", "Efficiency", "Events"].map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="driving-data-strip">
          <div>
            <span>MAX SPEED</span>
            <strong>{maxSpeed} km/h</strong>
          </div>
          <div>
            <span>AC USAGE</span>
            <strong>{acUsage}</strong>
          </div>
          <div>
            <span>TRAFFIC</span>
            <strong>{trafficLevel}</strong>
          </div>
          <div>
            <span>LOAD</span>
            <strong>{vehicleLoad}</strong>
          </div>
          <div>
            <span>ISSUES DETECTED</span>
            <strong>{issues.length}</strong>
          </div>
        </div>

        <div className="behavior-card-grid">
          {behaviorCards.map((card) => {
            const Icon = card.icon;

            return (
              <article className="behavior-card" key={card.title}>
                <div className="behavior-card-top">
                  <div className="behavior-icon">
                    <Icon size={18} />
                  </div>
                  <span>{card.label}</span>
                </div>

                <div className="behavior-number">
                  <strong>{card.value}</strong>
                  <small>{card.unit}</small>
                </div>

                <div className="behavior-bar">
                  <i style={{ width: `${card.progress}%` }} />
                </div>

                <p>{card.title}</p>
              </article>
            );
          })}
        </div>

        <div className="driving-main-grid">
          <article className="driving-panel behavior-chart-panel">
            <div className="panel-heading">
              <div>
                <span>DRIVING RHYTHM</span>
                <h3>Behavior throughout the trip</h3>
              </div>
              <div className="live-label">
                <span />
                {backendOnline ? "BACKEND DATA" : "DEFAULT DATA"}
              </div>
            </div>

            <div className="chart-legend-driving">
              <span>
                <i className="smooth-dot" />
                Smoothness
              </span>
              <span>
                <i className="efficiency-dot" />
                Efficiency
              </span>
            </div>

            <div className="driving-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={behaviorData}>
                  <defs>
                    <linearGradient id="smoothGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4de4a8" stopOpacity=".30" />
                      <stop offset="100%" stopColor="#4de4a8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="effGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4fbfff" stopOpacity=".20" />
                      <stop offset="100%" stopColor="#4fbfff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(126,175,169,.09)"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#688582"
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                  />
                  <YAxis
                    domain={[40, 100]}
                    stroke="#688582"
                    tickLine={false}
                    axisLine={false}
                    fontSize={9}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#071b1d",
                      border: "1px solid rgba(80,229,172,.24)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="smoothness"
                    stroke="#4de4a8"
                    strokeWidth={2.7}
                    fill="url(#smoothGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#4fbfff"
                    strokeWidth={2}
                    fill="url(#effGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="driving-panel signature-panel">
            <div className="panel-heading">
              <div>
                <span>DRIVING SIGNATURE</span>
                <h3>Your current pattern</h3>
              </div>
              <Sparkles size={18} />
            </div>

            <div className="signature-visual">
              <div className="signature-core">
                <CarFront size={22} />
                <strong>{overallScore}</strong>
                <span>Eco score</span>
              </div>

              <div className="signature-orbit orbit-top" />
              <div className="signature-orbit orbit-bottom" />
              <div className="signature-point point-one" />
              <div className="signature-point point-two" />
              <div className="signature-point point-three" />
            </div>

            <div className="signature-status">
              <CheckCircle2 size={17} />
              <div>
                <strong>{drivingRating} driving pattern</strong>
                <span>{issues.length ? primaryIssue : "Mostly smooth and predictable inputs."}</span>
              </div>
            </div>
          </article>
        </div>

        <div className="driving-bottom-grid">
          <article className="driving-panel events-panel">
            <div className="panel-heading">
              <div>
                <span>DRIVING EVENTS</span>
                <h3>Moments that changed the trip</h3>
              </div>
              <Navigation size={18} />
            </div>

            <div className="event-list">
              {events.map((event) => {
                const Icon = event.icon;
                const positive = event.severity === "Positive";

                return (
                  <div className="event-row" key={`${event.time}-${event.title}`}>
                    <div className={`event-icon ${positive ? "positive" : "attention"}`}>
                      <Icon size={15} />
                    </div>

                    <div className="event-info">
                      <div>
                        <strong>{event.title}</strong>
                        <time>{event.time}</time>
                      </div>
                      <span>{event.detail}</span>
                    </div>

                    <div className={`event-status ${positive ? "positive" : "attention"}`}>
                      {positive ? "Good" : "Review"}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="driving-panel recommendation-panel">
            <div className="recommendation-glow" />
            <div className="recommendation-icon">
              <Sparkles size={22} />
            </div>

            <span className="recommendation-kicker">AI RECOMMENDATION</span>
            <h3>{issues.length ? primaryIssue : "Keep your speed curve smoother."}</h3>
            <p>
              {issues.length
                ? `EcoDrive detected ${issues.length} driving factor${issues.length === 1 ? "" : "s"} to review. Your current average speed is ${averageSpeed} km/h with a maximum of ${maxSpeed} km/h.`
                : "Your current driving inputs show no major efficiency issue. Continue maintaining smooth, predictable control."}
            </p>

            <div className="recommendation-stat">
              <div>
                <ArrowDownRight size={17} />
                <strong>Efficiency opportunity</strong>
              </div>
              <span>{backendOnline ? "Backend analyzed" : "Default profile"}</span>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await runAnalysis();
                } catch {
                  // Keep the strategy view available when backend is offline.
                }
                document
                  .getElementById("driving-analysis")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View driving strategy
              <ArrowRight size={15} />
            </button>
          </article>
        </div>

        <section className="driving-road-banner">
          <div className="road-banner-image" />
          <div className="road-banner-overlay" />

          <div className="road-banner-copy">
            <span>THE CLEANER DRIVE</span>
            <h2>Small changes in control create a smoother journey.</h2>
            <p>
              Keep your inputs deliberate, your speed steady and your idle time
              intentional.
            </p>
          </div>

          <div className="road-banner-pill">
            <Leaf size={16} />
            Drive smoother
            <Minus size={14} />
            Waste less
          </div>
        </section>
      </section>

      <footer className="driving-footer">
        <span>EcoDrive AI</span>
        <span>Driving intelligence • Behavior analysis • Efficiency</span>
        <span>{backendOnline ? 'Backend connected' : loading ? 'Analyzing…' : 'Prototype interface'}</span>
      </footer>
    </main>
  );
}
