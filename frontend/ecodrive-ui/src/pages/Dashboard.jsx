import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Bot,
  CarFront,
  ChevronDown,
  Droplets,
  Gauge,
  Leaf,
  Lightbulb,
  MapPin,
  Play,
  Search,
  Settings2,
  Sparkles,
  Sun,
  TrendingDown,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Cell,
  Pie,
  PieChart,
} from 'recharts';

import heroBg from '../assets/01_hero_background.jpg';
import sidebarBg from '../assets/02_sidebar_background.jpg';
import leafBg from '../assets/03_leaf_background.jpg';
import plantBg from '../assets/04_small_plant_background.jpg';
import RealMap from '../components/RealMap';
import { useEcoDrive } from '../context/EcoDriveContext';
import './DashboardDemo.css';
import './DashboardMetricsFix.css';

const trend = [
  { day: 'Sep 8', vehicle: 142, similar: 206, target: 88 },
  { day: 'Sep 9', vehicle: 151, similar: 197, target: 88 },
  { day: 'Sep 10', vehicle: 122, similar: 165, target: 86 },
  { day: 'Sep 11', vehicle: 77, similar: 132, target: 82 },
  { day: 'Sep 12', vehicle: 82, similar: 137, target: 80 },
  { day: 'Sep 13', vehicle: 96, similar: 112, target: 76 },
  { day: 'Sep 14', vehicle: 83, similar: 109, target: 74 },
];

const sourceData = [
  { name: 'Engine Combustion', value: 52 },
  { name: 'Idling', value: 18 },
  { name: 'Acceleration', value: 15 },
  { name: 'AC & Electronics', value: 10 },
  { name: 'Others', value: 5 },
];

const sourceColors = ['#45dfa3', '#4faafc', '#ffbd3f', '#8e68ea', '#a6b4c4'];

function StatCard({ icon: Icon, title, value, unit, change, positive, cyan, score }) {
  return (
    <article className={`stat-card ${cyan ? 'cyan' : ''}`}>
      <div className="stat-icon"><Icon size={29} strokeWidth={1.8} /></div>
      <div className="stat-copy">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value} <small>{unit}</small></div>
        <div className={`stat-change ${positive ? 'positive' : 'negative'}`}>
          <TrendingDown size={14} /> {change}
        </div>
      </div>
      {score ? (
        <div className="score-ring" aria-label="Sustainability score">
          <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="17" /><circle className="progress" cx="22" cy="22" r="17" /></svg>
          <strong>{score}</strong>
        </div>
      ) : (
        <svg className="mini-spark" viewBox="0 0 92 42" preserveAspectRatio="none">
          <polyline points="0,32 12,26 19,30 28,13 38,21 48,18 61,11 71,15 80,6 92,8" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </article>
  );
}

export default function Dashboard() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [days, setDays] = useState('Last 7 Days');
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();
  const pipeline = analysis?.pipeline || {};
  const summary = pipeline?.summary || {};
  const routeComparison = pipeline?.route_comparison || {};
  const drivingAnalysis = pipeline?.driving_analysis || {};
  const optimization = pipeline?.optimization || {};
  const ecoPerformance = pipeline?.eco_performance || {};

  const total = useMemo(() => sourceData.reduce((sum, d) => sum + d.value, 0), []);

  const demoSteps = [
    {
      title: 'Vehicle Analysis',
      subtitle: 'Understanding your vehicle profile',
      icon: CarFront,
      detail: 'Fuel type, mileage and vehicle efficiency are evaluated first.',
    },
    {
      title: 'Driving Behavior',
      subtitle: 'Reading your driving pattern',
      icon: Gauge,
      detail: 'Speed, acceleration, braking, idling and traffic behavior are analyzed.',
    },
    {
      title: 'ML Fuel Prediction',
      subtitle: 'Predicting fuel consumption',
      icon: Zap,
      detail: 'The trained Gradient Boosting model estimates fuel consumption.',
    },
    {
      title: 'Route Optimization',
      subtitle: 'Finding a smarter route',
      icon: MapPin,
      detail: 'Route distance and traffic conditions are compared for fuel savings.',
    },
    {
      title: 'Carbon & Eco Optimization',
      subtitle: 'Building your greener plan',
      icon: Leaf,
      detail: 'CO₂ impact is calculated and the agents create actionable recommendations.',
    },
  ];

  useEffect(() => {
    if (!demoOpen) return;

    setDemoStep(0);

    const timer = window.setInterval(() => {
      setDemoStep((current) => {
        if (current >= demoSteps.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 1350);

    return () => window.clearInterval(timer);
  }, [demoOpen]);

  async function openDemo() {
    setDemoOpen(true);
    setDemoStep(0);

    try {
      await runAnalysis();
    } catch {
      // The visual demo remains available if the backend is offline.
    }
  }

  return (
    <div className="dashboard-ref">
      <header className="topbar-ref">
        <div className="search-box-ref">
          <Search size={18} />
          <input aria-label="Search" placeholder="Search vehicles, predictions, routes..." />
        </div>
        <div className="topbar-actions">
          <button className="icon-button-ref" aria-label="Theme"><Sun size={24} /></button>
          <button className="icon-button-ref bell" aria-label="Notifications"><Bell size={22} /><span /></button>
          <div className="profile-ref">
            <img src={plantBg} alt="Eco Driver" />
            <div><strong>Dileep</strong><small>Eco Driver</small></div>
          </div>
        </div>
      </header>

      <main className="dashboard-content-ref">
        <section className="hero-ref" style={{ backgroundImage: `url(${heroBg})` }}>
          <div className="hero-overlay-ref" />
          <div className="hero-content-ref">
            <h1>Cleaner Roads<br />Brighter <span>Tomorrows</span></h1>
            <p>AI-powered insights for a sustainable driving future.</p>
            <div className="hero-actions-ref">
              <button
                className="primary-ref demo-launch-button"
                onClick={openDemo}
                disabled={loading}
              >
                <Play size={16} fill="currentColor" />
                {loading ? 'Analyzing…' : 'Watch Demo'}
              </button>
              <Link className="secondary-ref" to="/vehicle-trip">Get Started <ArrowRight size={17} /></Link>
            </div>
          </div>
          <div className="hero-script">Drive<br /><span>change</span><Leaf size={37} fill="currentColor" /></div>
          <div className="hero-badge">
            <Leaf size={23} fill="currentColor" />
            <div><span>Lower Emissions</span><small>Healthier Planet</small><div className="hero-progress"><i /></div></div>
          </div>
        </section>

        <section className="stats-grid-ref">
          <StatCard icon={Leaf} title="Total CO₂ Emissions" value={Number.isFinite(Number(summary.co2_per_km)) ? (Number(summary.co2_per_km) * 1000).toFixed(1) : "—"} unit="g/km" change={backendOnline ? "Backend" : "Demo"} />
          <StatCard icon={Zap} title="Fuel Efficiency" value={Number.isFinite(Number(summary.equivalent_fuel_efficiency_kmpl)) ? Number(summary.equivalent_fuel_efficiency_kmpl).toFixed(1) : "—"} unit="km/l" change={backendOnline ? "Live analysis" : "+12%"} positive cyan />
          <StatCard icon={Bot} title="AI Predicted Emissions" value={Number.isFinite(Number(summary.co2_per_km)) ? (Number(summary.co2_per_km) * 1000).toFixed(1) : "—"} unit="g/km" change={backendOnline ? "ML pipeline" : "−24%"} />
          <StatCard icon={Leaf} title="Sustainability Score" value={summary?.eco_performance_rating || "—"} unit="" change={summary?.eco_performance_rating ? "Calculated" : "Awaiting analysis"} positive score={Number.isFinite(Number(summary?.eco_performance_score)) ? `${Math.round(Number(summary.eco_performance_score))}%` : "—"} />
        </section>

        <section className="dashboard-grid-ref">
          <article className="panel-ref trend-panel">
            <div className="panel-header-ref"><h2>Emissions Trend</h2><button className="select-ref" onClick={() => setDays(days === 'Last 7 Days' ? 'Last 30 Days' : 'Last 7 Days')}>{days}<ChevronDown size={16} /></button></div>
            <div className="chart-wrap-ref"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#29404b" vertical={true} horizontal={true} strokeDasharray="1 0" opacity={0.45} />
              <XAxis dataKey="day" tick={{ fill: '#b6c3cc', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 300]} tick={{ fill: '#b6c3cc', fontSize: 12 }} axisLine={false} tickLine={false} ticks={[0,100,200,300]} />
              <Tooltip contentStyle={{ background: '#112129', border: '1px solid #33505d', borderRadius: 12, color: '#fff' }} />
              <Line type="monotone" dataKey="similar" stroke="#54b4ff" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="vehicle" stroke="#3fe39d" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="target" stroke="#8da0aa" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart></ResponsiveContainer></div>
            <div className="chart-legend-ref"><span><i className="green" />Your Vehicle</span><span><i className="blue" />Similar Vehicles</span><span><i className="dashed" />Target Limit</span></div>
          </article>

          <article className="panel-ref breakdown-panel">
            <div className="panel-header-ref"><h2>Emission Sources Breakdown</h2><span className="panel-note-ref">Illustrative</span></div>
            <div className="breakdown-body-ref">
              <div className="donut-ref"><PieChart width={210} height={210}><Pie data={sourceData} dataKey="value" innerRadius={63} outerRadius={91} startAngle={90} endAngle={-270} paddingAngle={0} stroke="none">
                {sourceData.map((entry, index) => <Cell key={entry.name} fill={sourceColors[index]} />)}
              </Pie></PieChart><div className="donut-label"><strong>{Number.isFinite(Number(summary?.co2_per_km)) ? (Number(summary.co2_per_km) * 1000).toFixed(1) : "—"}</strong><span>g/km</span></div></div>
              <div className="breakdown-list-ref">{sourceData.map((item, index) => <div key={item.name}><i style={{ background: sourceColors[index] }} /><span>{item.name}</span><b>{item.value}%</b></div>)}</div>
            </div>
          </article>

          <article className="panel-ref ai-panel">
            <div className="panel-header-ref"><h2>AI Insights</h2><Link to="/assistant">View All</Link></div>
            <div className="insights-ref">
              <div className="insight-ref"><div className="insight-icon bulb"><Lightbulb size={25} /></div><p>{routeComparison?.recommended_route ? `${routeComparison.recommended_route} is currently recommended from the route comparison.` : "Run a journey analysis to generate a route recommendation."}</p></div>
              <div className="insight-ref"><div className="insight-icon speed"><Gauge size={24} /></div><p>{Number.isFinite(Number(drivingAnalysis?.driving_efficiency_score)) ? `Current driving score: ${Number(drivingAnalysis.driving_efficiency_score)}/100. ${drivingAnalysis.driving_rating || "Review your driving pattern."}` : "Run a journey analysis to evaluate driving behavior."}</p></div>
              <div className="insight-ref"><div className="insight-icon leaf"><Leaf size={25} /></div><p>{Number.isFinite(Number(summary?.co2_per_km)) ? `Current estimated carbon intensity: ${(Number(summary.co2_per_km) * 1000).toFixed(1)} g/km.` : "Carbon impact will appear after your analysis."}</p></div>
            </div>
          </article>

          <article className="panel-ref route-panel">
            <div className="panel-header-ref"><h2>Route Optimizer</h2></div>
            <div className="route-body-ref">
              <div className="route-map-ref"><RealMap /></div>
              <div className="route-info-ref"><div className="recommended"><Leaf size={22} fill="currentColor" /><span>{routeComparison?.recommended_route || "Route recommendation"}</span></div><div className="route-meta"><b>{routeComparison?.route_a?.distance_km ?? "—"} km</b><span>|</span><b>{routeComparison?.route_a?.traffic_level || "—"}</b></div><div className="route-emissions">Estimated Route Fuel<br /><strong>{routeComparison?.route_a?.estimated_fuel_litres != null ? `${Number(routeComparison.route_a.estimated_fuel_litres).toFixed(2)} L` : "—"}</strong> <small>{routeComparison?.estimated_fuel_saved_litres != null ? `−${Number(routeComparison.estimated_fuel_saved_litres).toFixed(2)} L alt.` : ""}</small></div><Link to="/route" className="outline-ref">View on Map <ArrowRight size={16} /></Link></div>
            </div>
          </article>

          <article className="panel-ref vehicle-panel">
            <div className="panel-header-ref"><h2>Vehicle Comparison</h2><Link to="/vehicle-trip">View All</Link></div>
            <div className="vehicle-cards-ref">
              {[['Petrol','142',''],['Diesel','168',''],['Hybrid','98','active'],['Electric','0','electric']].map(([name,value,cls]) => <div className={`vehicle-card-ref ${cls}`} key={name}><span>{name}</span><CarFront size={24} /><strong>{value}</strong><small>g/km</small></div>)}
            </div>
          </article>

          <article className="panel-ref impact-panel" style={{ backgroundImage: `linear-gradient(180deg, rgba(8,24,25,.18), rgba(8,24,25,.82)), url(${plantBg})` }}>
            <div><h2>Small<br />Choices<br /><span>Big Impact</span></h2><div className="impact-line" /><p>Drive Today for a<br />Greener Tomorrow.</p></div>
          </article>
        </section>
      </main>

      {demoOpen && (
        <div
          className="ecodrive-demo-backdrop"
          onClick={() => setDemoOpen(false)}
        >
          <div
            className="ecodrive-demo-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="ecodrive-demo-close"
              onClick={() => setDemoOpen(false)}
              aria-label="Close demo"
            >
              <X size={20} />
            </button>

            <div className="ecodrive-demo-header">
              <div className="ecodrive-demo-icon">
                <Bot size={28} />
              </div>

              <div>
                <span>ECODRIVE AI · LIVE PIPELINE</span>
                <h2>See how your drive becomes an eco plan.</h2>
                <p>
                  Watch the complete multi-stage analysis flow used by
                  EcoDrive AI.
                </p>
              </div>
            </div>

            <div className="ecodrive-demo-status">
              <span className={backendOnline ? 'demo-status-dot online' : 'demo-status-dot'} />
              <strong>
                {loading
                  ? 'Running EcoDrive analysis…'
                  : backendOnline
                    ? 'Backend connected · Analysis pipeline ready'
                    : 'Demo mode · Backend not connected'}
              </strong>
            </div>

            <div className="ecodrive-demo-progress">
              {demoSteps.map((step, index) => {
                const Icon = step.icon;
                const active = index === demoStep;
                const completed = index < demoStep;

                return (
                  <div
                    key={step.title}
                    className={`ecodrive-demo-step ${
                      active ? 'active' : ''
                    } ${completed ? 'completed' : ''}`}
                  >
                    <div className="ecodrive-demo-step-icon">
                      {completed ? (
                        <Leaf size={17} />
                      ) : (
                        <Icon size={17} />
                      )}
                    </div>

                    <div className="ecodrive-demo-step-copy">
                      <strong>{step.title}</strong>
                      <span>{step.subtitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ecodrive-demo-current">
              {(() => {
                const current = demoSteps[demoStep];
                const Icon = current.icon;

                return (
                  <>
                    <div className="ecodrive-demo-current-icon">
                      <Icon size={30} />
                    </div>

                    <div className="ecodrive-demo-current-copy">
                      <span>STAGE {demoStep + 1} OF {demoSteps.length}</span>
                      <h3>{current.title}</h3>
                      <p>{current.detail}</p>
                    </div>

                    <div className="ecodrive-demo-live-wave">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </>
                );
              })()}
            </div>

            {summary?.eco_performance_score != null && (
              <div className="ecodrive-demo-results">
                <div>
                  <span>ECO SCORE</span>
                  <strong>
                    {Math.round(summary.eco_performance_score)}
                  </strong>
                  <small>/100</small>
                </div>

                <div>
                  <span>FUEL EFFICIENCY</span>
                  <strong>
                    {Number(
                      summary.equivalent_fuel_efficiency_kmpl
                    ).toFixed(1)}
                  </strong>
                  <small>km/L</small>
                </div>

                <div>
                  <span>TRIP CO₂</span>
                  <strong>
                    {Number(
                      summary.estimated_trip_co2_kg
                    ).toFixed(1)}
                  </strong>
                  <small>kg</small>
                </div>
              </div>
            )}

            <div className="ecodrive-demo-footer">
              <div>
                <Sparkles size={16} />
                <span>
                  {demoStep === demoSteps.length - 1
                    ? 'Eco plan generated — explore your dashboard results.'
                    : 'EcoDrive AI is passing the journey through its analysis stages.'}
                </span>
              </div>

              <button
                type="button"
                className="ecodrive-demo-explore"
                onClick={() => setDemoOpen(false)}
              >
                Explore Dashboard
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
