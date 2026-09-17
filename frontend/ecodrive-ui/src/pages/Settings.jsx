import React, { useState } from 'react';
import {
  UserRound,
  CarFront,
  Leaf,
  Bell,
  Brain,
  MapPinned,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  ChevronRight,
  Check,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import './Settings.css';

const sections = [
  { id: 'profile', label: 'Driver Profile', icon: UserRound },
  { id: 'vehicle', label: 'Vehicle Preferences', icon: CarFront },
  { id: 'eco', label: 'Eco Goals', icon: Leaf },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai', label: 'AI Preferences', icon: Brain },
  { id: 'route', label: 'Route Preferences', icon: MapPinned },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'privacy', label: 'Privacy & Data', icon: ShieldCheck },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? 'on' : ''}`}
      onClick={onChange}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}

function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-icon">
        <Icon size={18} />
      </div>
      <div className="settings-row-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

export default function Settings() {
  const [active, setActive] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [tripAlerts, setTripAlerts] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);
  const [ecoRecommendations, setEcoRecommendations] = useState(true);
  const [location, setLocation] = useState(true);
  const [anonymousData, setAnonymousData] = useState(false);
  const [theme, setTheme] = useState('Dark');
  const [units, setUnits] = useState('Metric');

  const saveSettings = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const resetSettings = () => {
    setNotifications(true);
    setTripAlerts(true);
    setAiInsights(true);
    setEcoRecommendations(true);
    setLocation(true);
    setAnonymousData(false);
    setTheme('Dark');
    setUnits('Metric');
  };

  return (
    <main className="settings-page">
      <div className="settings-bg-orb settings-bg-one" />
      <div className="settings-bg-orb settings-bg-two" />

      <section className="settings-hero">
        <div>
          <div className="settings-eyebrow">
            <span />
            ECODRIVE CONTROL CENTER
          </div>
          <h1>Settings</h1>
          <p>
            Personalize your EcoDrive AI experience, driving insights,
            notifications and sustainability preferences.
          </p>
        </div>

        <div className="settings-hero-badge">
          <Sparkles size={17} />
          <div>
            <strong>System ready</strong>
            <span>Preferences are stored locally for this UI</span>
          </div>
        </div>
      </section>

      <section className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-label">PREFERENCES</div>

          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={active === id ? 'active' : ''}
              onClick={() => setActive(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={15} />
            </button>
          ))}

          <div className="settings-sidebar-footer">
            <div className="settings-mini-mark">
              <Leaf size={19} />
            </div>
            <div>
              <strong>EcoDrive AI</strong>
              <span>Personal control center</span>
            </div>
          </div>
        </aside>

        <div className="settings-content">
          {active === 'profile' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>DRIVER PROFILE</span>
                  <h2>Your driving identity</h2>
                </div>
                <UserRound size={21} />
              </div>

              <div className="settings-profile-card">
                <div className="settings-avatar">ED</div>
                <div className="settings-profile-info">
                  <span>ACTIVE PROFILE</span>
                  <h3>Eco Driver</h3>
                  <p>Your preferences are used to personalize the dashboard experience.</p>
                </div>
                <div className="settings-profile-status">
                  <i />
                  Active
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>General preferences</h3>
                  <SlidersHorizontal size={18} />
                </div>

                <SettingRow
                  icon={UserRound}
                  title="Display name"
                  description="Name shown on your EcoDrive profile"
                >
                  <span className="settings-value">Eco Driver</span>
                </SettingRow>

                <SettingRow
                  icon={Leaf}
                  title="Measurement units"
                  description="Choose how distance and fuel values are displayed"
                >
                  <div className="settings-segmented">
                    {['Metric', 'Imperial'].map((item) => (
                      <button
                        key={item}
                        className={units === item ? 'active' : ''}
                        onClick={() => setUnits(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </SettingRow>
              </div>
            </>
          )}

          {active === 'vehicle' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>VEHICLE PREFERENCES</span>
                  <h2>Your vehicle setup</h2>
                </div>
                <CarFront size={21} />
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Default vehicle</h3>
                  <CarFront size={18} />
                </div>
                <div className="settings-vehicle-preview">
                  <div className="settings-vehicle-icon"><CarFront size={28} /></div>
                  <div>
                    <strong>Primary vehicle</strong>
                    <span>Used as the default for trip analysis and predictions.</span>
                  </div>
                  <button className="settings-outline-button">
                    Configure <ChevronRight size={15} />
                  </button>
                </div>

                <SettingRow
                  icon={CarFront}
                  title="Vehicle data"
                  description="Use the selected vehicle for dashboard calculations"
                >
                  <Toggle checked={true} onChange={() => {}} />
                </SettingRow>
              </div>

              <div className="settings-info-strip">
                <CarFront size={18} />
                <div>
                  <strong>Vehicle data integration</strong>
                  <span>Live vehicle telemetry can be connected in a later hardware/vehicle-data integration.</span>
                </div>
              </div>
            </>
          )}

          {active === 'eco' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>SUSTAINABILITY</span>
                  <h2>Set your eco goals</h2>
                </div>
                <Leaf size={21} />
              </div>

              <div className="settings-goal-grid">
                <div className="settings-goal-card">
                  <span>WEEKLY CO₂ TARGET</span>
                  <strong>25 kg</strong>
                  <div className="settings-goal-progress"><i style={{ width: '68%' }} /></div>
                  <small>68% of your demo target progress</small>
                </div>
                <div className="settings-goal-card">
                  <span>EFFICIENCY TARGET</span>
                  <strong>7.0 L/100km</strong>
                  <div className="settings-goal-progress"><i style={{ width: '76%' }} /></div>
                  <small>Prototype goal indicator</small>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Eco coaching</h3>
                  <Leaf size={18} />
                </div>
                <SettingRow
                  icon={Leaf}
                  title="Eco recommendations"
                  description="Show suggestions for reducing fuel use and emissions"
                >
                  <Toggle checked={ecoRecommendations} onChange={() => setEcoRecommendations(!ecoRecommendations)} />
                </SettingRow>
              </div>
            </>
          )}

          {active === 'notifications' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>NOTIFICATIONS</span>
                  <h2>Stay informed</h2>
                </div>
                <Bell size={21} />
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Notification controls</h3>
                  <Bell size={18} />
                </div>
                <SettingRow
                  icon={Bell}
                  title="EcoDrive notifications"
                  description="Receive important dashboard and system notifications"
                >
                  <Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />
                </SettingRow>
                <SettingRow
                  icon={MapPinned}
                  title="Trip alerts"
                  description="Alerts related to route and trip analysis"
                >
                  <Toggle checked={tripAlerts} onChange={() => setTripAlerts(!tripAlerts)} />
                </SettingRow>
              </div>
            </>
          )}

          {active === 'ai' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>AI PREFERENCES</span>
                  <h2>Control your AI experience</h2>
                </div>
                <Brain size={21} />
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Intelligence controls</h3>
                  <Brain size={18} />
                </div>
                <SettingRow
                  icon={Brain}
                  title="AI driving insights"
                  description="Show personalized interpretation of driving behavior"
                >
                  <Toggle checked={aiInsights} onChange={() => setAiInsights(!aiInsights)} />
                </SettingRow>
                <SettingRow
                  icon={Sparkles}
                  title="Personalized coaching"
                  description="Generate recommendations from your analyzed trips"
                >
                  <Toggle checked={ecoRecommendations} onChange={() => setEcoRecommendations(!ecoRecommendations)} />
                </SettingRow>
              </div>

              <div className="settings-info-strip">
                <Brain size={18} />
                <div>
                  <strong>AI backend status</strong>
                  <span>Current UI uses demonstration values. Your ADK agents remain available for the conversational agent layer.</span>
                </div>
              </div>
            </>
          )}

          {active === 'route' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>ROUTE PREFERENCES</span>
                  <h2>Plan smarter journeys</h2>
                </div>
                <MapPinned size={21} />
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Route intelligence</h3>
                  <MapPinned size={18} />
                </div>
                <SettingRow
                  icon={MapPinned}
                  title="Location access"
                  description="Allow route features to use your location when integrated"
                >
                  <Toggle checked={location} onChange={() => setLocation(!location)} />
                </SettingRow>
                <SettingRow
                  icon={Leaf}
                  title="Prefer efficient routes"
                  description="Prioritize fuel and emissions impact when route optimization is connected"
                >
                  <Toggle checked={true} onChange={() => {}} />
                </SettingRow>
              </div>
            </>
          )}

          {active === 'appearance' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>APPEARANCE</span>
                  <h2>Make it yours</h2>
                </div>
                <Palette size={21} />
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Interface theme</h3>
                  <Palette size={18} />
                </div>

                <div className="settings-theme-grid">
                  {['Dark', 'System'].map((item) => (
                    <button
                      key={item}
                      className={theme === item ? 'active' : ''}
                      onClick={() => setTheme(item)}
                    >
                      <div className={`settings-theme-preview ${item.toLowerCase()}`}>
                        <span />
                        <i />
                        <b />
                      </div>
                      <div>
                        <strong>{item}</strong>
                        {theme === item && <Check size={15} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {active === 'privacy' && (
            <>
              <div className="settings-content-heading">
                <div>
                  <span>PRIVACY & DATA</span>
                  <h2>Your data controls</h2>
                </div>
                <ShieldCheck size={21} />
              </div>

              <div className="settings-card">
                <div className="settings-card-title">
                  <h3>Privacy preferences</h3>
                  <ShieldCheck size={18} />
                </div>
                <SettingRow
                  icon={MapPinned}
                  title="Location access"
                  description="Allow location-based features when the route system is connected"
                >
                  <Toggle checked={location} onChange={() => setLocation(!location)} />
                </SettingRow>
                <SettingRow
                  icon={ShieldCheck}
                  title="Anonymous improvement data"
                  description="Allow anonymous usage data for improving the prototype experience"
                >
                  <Toggle checked={anonymousData} onChange={() => setAnonymousData(!anonymousData)} />
                </SettingRow>
              </div>

              <div className="settings-privacy-note">
                <ShieldCheck size={18} />
                <div>
                  <strong>Privacy-first design</strong>
                  <span>These controls are UI preferences for the current prototype and do not yet represent connected backend data permissions.</span>
                </div>
              </div>
            </>
          )}

          <div className="settings-actions">
            <button className="settings-reset-button" onClick={resetSettings}>
              <RotateCcw size={16} />
              Reset
            </button>
            <button className={`settings-save-button ${saved ? 'saved' : ''}`} onClick={saveSettings}>
              {saved ? <Check size={17} /> : <Check size={17} />}
              {saved ? 'Saved' : 'Save preferences'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
