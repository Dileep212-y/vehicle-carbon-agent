import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  MapPinned,
  CarFront,
  FileText,
  Leaf,
  Settings,
  CircleUserRound,
  Brain,
} from "lucide-react";

const items = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Vehicle & Trip",
    to: "/vehicle-trip",
    icon: CarFront,
  },
  {
    label: "Driving Analysis",
    to: "/driving-analysis",
    icon: Brain,
  },
  {
    label: "Emissions Analysis",
    to: "/carbon",
    icon: BarChart3,
  },
  {
    label: "AI Predictions",
    to: "/assistant",
    icon: Sparkles,
  },
  {
    label: "Route Optimizer",
    to: "/route",
    icon: MapPinned,
  },
  {
    label: "Reports",
    to: "/history",
    icon: FileText,
  },
  {
    label: "Sustainability Tips",
    to: "/driving",
    icon: Leaf,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar-ref">
      <div className="sidebar-brand">
        <div className="brand-leaf-mark">
          <Leaf
            size={39}
            strokeWidth={2.4}
            fill="currentColor"
          />
        </div>

        <div>
          <div className="brand-name">
            <span>EcoDrive</span>
            <em>AI</em>
          </div>

          <div className="brand-subtitle">
            Drive Smarter. Breathe Cleaner.
          </div>
        </div>
      </div>

      <nav
        className="sidebar-nav-ref"
        aria-label="Primary navigation"
      >
        {items.map(
          ({ label, to, icon: Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `sidebar-link-ref ${
                  isActive ? "active" : ""
                }`
              }
            >
              <Icon
                size={25}
                strokeWidth={1.9}
              />

              <span>{label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div
        className="sidebar-visual-ref"
        aria-hidden="true"
      >
        <div className="sidebar-visual-image" />

        <div className="sidebar-visual-overlay" />

        <div className="sidebar-quote">
          <div>“A Greener</div>
          <div>Tomorrow</div>
          <div>Starts with</div>
          <div>Every Drive”</div>
          <span>—</span>
        </div>
      </div>

      <div className="sidebar-user-mini">
        <CircleUserRound size={20} />
        <span>Eco Driver</span>
      </div>
    </aside>
  );
}