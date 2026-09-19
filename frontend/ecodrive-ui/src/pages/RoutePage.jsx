import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CarFront,
  Check,
  Clock3,
  CloudRain,
  Fuel,
  Leaf,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./RoutePage.css";
import { DEFAULT_ANALYSIS_PAYLOAD } from "../services/api";
import { useEcoDrive } from "../context/EcoDriveContext";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

const trafficOptions = ["low", "moderate", "heavy"];

function createCarIcon() {
  return L.divIcon({
    className: "route-car-marker",
    html: `<div class="route-car-marker-inner"><span></span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function createPinIcon(type) {
  const className = type === "start" ? "route-pin-start" : "route-pin-end";
  return L.divIcon({
    className: `route-pin ${className}`,
    html: `<div class="route-pin-inner"></div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 36],
  });
}

function formatDistance(km) {
  if (!Number.isFinite(km)) return "—";
  return `${km.toFixed(1)} km`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "—";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return minutes + " min";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? hours + "h " + remaining + "m" : hours + "h";
}

function trafficTimeMultiplier(traffic = "moderate") {
  const normalized = String(traffic).toLowerCase();
  if (normalized === "heavy") return 1.25;
  if (normalized === "low") return 1.0;
  return 1.10;
}

function formatRouteTime(route) {
  if (!route) return "—";
  return formatTime(Number(route.durationSeconds) * trafficTimeMultiplier(route.traffic));
}

function titleCase(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

async function searchPlaces(query) {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Location search is temporarily unavailable.");
  }

  const data = await response.json();
  return data.map((item) => ({
    id: item.place_id,
    name: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
  }));
}

async function reverseGeocode(lat, lon) {
  const url = `${REVERSE_URL}?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to identify your current location.");
  }

  const data = await response.json();
  return data.display_name || "Current location";
}

function normalizeOsrmRoute(route, index, source = "OSRM route alternative") {
  return {
    id: index === 0 ? "route-a" : "route-b",
    name: index === 0 ? "Route A" : "Route B",
    distanceKm: route.distance / 1000,
    durationSeconds: route.duration,
    geometry: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    traffic: index === 0 ? "moderate" : "low",
    source,
  };
}

function routeGeometryDifference(firstGeometry, secondGeometry) {
  if (!firstGeometry?.length || !secondGeometry?.length) return 0;

  const sampleCount = Math.min(20, firstGeometry.length, secondGeometry.length);
  let totalDifference = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const firstIndex = Math.floor(
      (index / Math.max(1, sampleCount - 1)) * (firstGeometry.length - 1)
    );
    const secondIndex = Math.floor(
      (index / Math.max(1, sampleCount - 1)) * (secondGeometry.length - 1)
    );

    const first = firstGeometry[firstIndex];
    const second = secondGeometry[secondIndex];

    if (!first || !second) continue;

    totalDifference +=
      Math.abs(first[0] - second[0]) + Math.abs(first[1] - second[1]);
  }

  return totalDifference / sampleCount;
}

function createDetourCandidates(start, destination) {
  const startLat = Number(start.lat);
  const startLon = Number(start.lon);
  const endLat = Number(destination.lat);
  const endLon = Number(destination.lon);

  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;

  const latDelta = endLat - startLat;
  const lonDelta = endLon - startLon;
  const magnitude = Math.sqrt(latDelta * latDelta + lonDelta * lonDelta);

  let perpendicularLat;
  let perpendicularLon;

  if (magnitude < 0.0001) {
    perpendicularLat = 1;
    perpendicularLon = 1;
  } else {
    perpendicularLat = -lonDelta / magnitude;
    perpendicularLon = latDelta / magnitude;
  }

  const offsets = [0.008, -0.008, 0.015, -0.015, 0.025, -0.025];

  return offsets.map((offset) => ({
    lat: midLat + perpendicularLat * offset,
    lon: midLon + perpendicularLon * offset,
  }));
}

async function fetchRouteThroughWaypoint(start, destination, waypoint) {
  const coordinates =
    `${start.lon},${start.lat};` +
    `${waypoint.lon},${waypoint.lat};` +
    `${destination.lon},${destination.lat}`;

  const url =
    `${OSRM_URL}/${coordinates}` +
    `?overview=full&geometries=geojson&steps=false&alternatives=false`;

  const response = await fetch(url);

  if (!response.ok) return null;

  const data = await response.json();

  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    !data.routes.length
  ) {
    return null;
  }

  return data.routes[0];
}

async function fetchDrivingRoutes(start, destination) {
  const coordinates = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;
  const url =
    `${OSRM_URL}/${coordinates}?overview=full&geometries=geojson&steps=false&alternatives=true`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("The routing service could not calculate this journey.");
  }

  const data = await response.json();

  if (
    data.code !== "Ok" ||
    !Array.isArray(data.routes) ||
    !data.routes.length
  ) {
    throw new Error("No drivable route was found between these locations.");
  }

  const directRoutes = data.routes
    .slice(0, 2)
    .map((route, index) =>
      normalizeOsrmRoute(route, index, "OSRM route alternative")
    );

  if (directRoutes.length >= 2) {
    return directRoutes;
  }

  const primaryRoute = directRoutes[0];
  const candidates = createDetourCandidates(start, destination);

  for (const waypoint of candidates) {
    try {
      const detourRoute = await fetchRouteThroughWaypoint(
        start,
        destination,
        waypoint
      );

      if (!detourRoute) continue;

      const alternativeGeometry =
        detourRoute.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || [];

      if (!alternativeGeometry.length) continue;

      const difference = routeGeometryDifference(
        primaryRoute.geometry,
        alternativeGeometry
      );

      const distanceKm = detourRoute.distance / 1000;
      const distanceDifference = Math.abs(
        distanceKm - primaryRoute.distanceKm
      );

      const isMeaningfullyDifferent =
        difference > 0.00005 || distanceDifference > 0.5;

      if (!isMeaningfullyDifferent) continue;

      return [
        primaryRoute,
        {
          id: "route-b",
          name: "Route B",
          distanceKm,
          durationSeconds: detourRoute.duration,
          geometry: alternativeGeometry,
          traffic: "low",
          source: "OSRM EcoDrive detour alternative",
        },
      ];
    } catch {
      // Try the next detour candidate.
    }
  }

  return [primaryRoute];
}


function getRouteScore(route, bestDistance) {
  if (!route || !Number.isFinite(bestDistance) || bestDistance <= 0) return 0;
  const distancePenalty = Math.max(0, (route.distanceKm - bestDistance) / bestDistance);
  const trafficPenalty = route.traffic === "heavy" ? 14 : route.traffic === "moderate" ? 7 : 0;
  return Math.max(0, Math.min(100, Math.round(100 - distancePenalty * 35 - trafficPenalty)));
}

function getBackendRoute(result, key) {
  return result?.[key] || {};
}

export default function RoutePage() {
  const { analysis, loading, backendOnline, runAnalysis } = useEcoDrive();

  const [map, setMap] = useState(null);
  const routeLayerRef = useRef(null);
  const markerLayerRef = useRef(null);

  const [startQuery, setStartQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [startLocation, setStartLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [locating, setLocating] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeOptions, setRouteOptions] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showLayers, setShowLayers] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [analyzingRoutes, setAnalyzingRoutes] = useState(false);
  const [routeAnalysisError, setRouteAnalysisError] = useState("");

  const backendRoutes = analysis?.pipeline?.route_comparison;

  const selectedRoute = useMemo(
    () => routeOptions.find((route) => route.id === selectedRouteId) || routeOptions[0] || null,
    [routeOptions, selectedRouteId]
  );

  const routeA = getBackendRoute(backendRoutes, "route_a");
  const routeB = getBackendRoute(backendRoutes, "route_b");
  const recommendedRoute = backendRoutes?.recommended_route || "";

  const hasTwoRoutes = routeOptions.length >= 2;
  const canCalculate = Boolean(startLocation && destination && !routeLoading);

  useEffect(() => {
    const mapInstance = L.map("eco-route-map", {
      zoomControl: false,
      attributionControl: true,
    }).setView([17.456, 78.402], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapInstance);

    L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

    routeLayerRef.current = L.layerGroup().addTo(mapInstance);
    markerLayerRef.current = L.layerGroup().addTo(mapInstance);
    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    if (!map || !routeOptions.length) return;

    routeLayerRef.current?.clearLayers();
    markerLayerRef.current?.clearLayers();

    routeOptions.forEach((route, index) => {
      const isActive = route.id === selectedRouteId || (!selectedRouteId && index === 0);
      L.polyline(route.geometry, {
        color: isActive ? "#55e6ac" : "#6e8886",
        weight: isActive ? 6 : 3,
        opacity: isActive ? 0.96 : 0.32,
        lineCap: "round",
        lineJoin: "round",
        dashArray: isActive ? undefined : "8 10",
      }).addTo(routeLayerRef.current);
    });

    if (startLocation) {
      L.marker([startLocation.lat, startLocation.lon], { icon: createPinIcon("start") }).addTo(markerLayerRef.current);
    }

    if (destination) {
      L.marker([destination.lat, destination.lon], { icon: createPinIcon("end") }).addTo(markerLayerRef.current);
    }

    if (selectedRoute?.geometry?.length) {
      const middle = selectedRoute.geometry[Math.floor(selectedRoute.geometry.length / 2)];
      L.marker(middle, { icon: createCarIcon() }).addTo(markerLayerRef.current);
      map.fitBounds(L.latLngBounds(selectedRoute.geometry), {
        padding: [45, 45],
        maxZoom: 15,
      });
    }
  }, [map, routeOptions, selectedRouteId, selectedRoute, startLocation, destination]);

  useEffect(() => {
    const value = startQuery.trim();
    if (!value || startLocation?.name === value || value.length < 3) {
      setStartSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingStart(true);
        setStartSuggestions(await searchPlaces(value));
      } catch {
        setStartSuggestions([]);
      } finally {
        setSearchingStart(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [startQuery, startLocation]);

  useEffect(() => {
    const value = destinationQuery.trim();
    if (!value || destination?.name === value || value.length < 3) {
      setDestinationSuggestions([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingDestination(true);
        setDestinationSuggestions(await searchPlaces(value));
      } catch {
        setDestinationSuggestions([]);
      } finally {
        setSearchingDestination(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [destinationQuery, destination]);

  const chooseStart = (place) => {
    setStartLocation(place);
    setStartQuery(place.name);
    setStartSuggestions([]);
    resetRoutesOnly();
  };

  const chooseDestination = (place) => {
    setDestination(place);
    setDestinationQuery(place.name);
    setDestinationSuggestions([]);
    resetRoutesOnly();
  };

  const resetRoutesOnly = () => {
    setRouteOptions([]);
    setSelectedRouteId(null);
    setRouteError("");
    setRouteAnalysisError("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setRouteError("This browser does not provide location access. Search for your starting location instead.");
      return;
    }

    setLocating(true);
    setRouteError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const name = await reverseGeocode(latitude, longitude);
          chooseStart({
            id: `current-${Date.now()}`,
            name: `Current location · ${name}`,
            lat: latitude,
            lon: longitude,
          });
        } catch (error) {
          setRouteError(error.message || "Unable to identify your current location.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        const message = error.code === 1
          ? "Location permission was denied. Allow location access in the browser or search for your starting location."
          : "Unable to read your current location. Search for your starting location instead.";
        setRouteError(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const calculateRoutes = async () => {
    if (!startLocation || !destination) {
      setRouteError("Select both a start location and a destination before calculating routes.");
      return;
    }

    if (startLocation.lat === destination.lat && startLocation.lon === destination.lon) {
      setRouteError("Start and destination cannot be the same location.");
      return;
    }

    try {
      setRouteLoading(true);
      setRouteError("");
      setRouteAnalysisError("");
      const routes = await fetchDrivingRoutes(startLocation, destination);
      setRouteOptions(routes);
      setSelectedRouteId(routes[0]?.id || null);

      if (routes.length < 2) {
        setRouteError("OSRM found one drivable route, but could not find a second distinct drivable alternative for this journey. Try another start/destination pair.");
      }
    } catch (error) {
      setRouteOptions([]);
      setSelectedRouteId(null);
      setRouteError(error.message || "Unable to calculate routes.");
    } finally {
      setRouteLoading(false);
    }
  };

  const updateTraffic = (routeId, traffic) => {
    setRouteOptions((current) =>
      current.map((route) => (route.id === routeId ? { ...route, traffic } : route))
    );
    setRouteAnalysisError("");
  };

  const analyzeRoutes = async () => {
    if (!hasTwoRoutes) {
      setRouteAnalysisError("Calculate two route alternatives first.");
      return;
    }

    try {
      setAnalyzingRoutes(true);
      setRouteAnalysisError("");

      const first = routeOptions[0];
      const second = routeOptions[1];

      await runAnalysis({
        ...DEFAULT_ANALYSIS_PAYLOAD,
        route_a_distance_km: Number(first.distanceKm.toFixed(3)),
        route_a_traffic_level: first.traffic,
        route_b_distance_km: Number(second.distanceKm.toFixed(3)),
        route_b_traffic_level: second.traffic,
        distance_km: Number(first.distanceKm.toFixed(3)),
      });
    } catch (error) {
      setRouteAnalysisError(error.message || "The EcoDrive backend could not analyze these routes.");
    } finally {
      setAnalyzingRoutes(false);
    }
  };

  const clearAll = () => {
    setStartLocation(null);
    setDestination(null);
    setStartQuery("");
    setDestinationQuery("");
    setStartSuggestions([]);
    setDestinationSuggestions([]);
    setRouteOptions([]);
    setSelectedRouteId(null);
    setRouteError("");
    setRouteAnalysisError("");
    routeLayerRef.current?.clearLayers();
    markerLayerRef.current?.clearLayers();
    map?.setView([17.456, 78.402], 13);
  };

  const backendRecommendedIndex = recommendedRoute === "Route B" ? 1 : 0;
  const recommendedLocalRoute = routeOptions[backendRecommendedIndex];
  const bestDistance = Math.min(...routeOptions.map((route) => route.distanceKm));

  return (
    <main className="route-page">
      <section className="route-hero">
        <div className="route-hero-copy">
          <div className="route-kicker">
            <span />
            ROUTE INTELLIGENCE
          </div>

          <h1>
            Take the road
            <span>that wastes less.</span>
          </h1>

          <p>
            Choose your real start and destination. EcoDrive then compares the
            available route alternatives using distance, traffic assumptions,
            fuel use, cost and estimated CO₂ impact.
          </p>

          <div className="route-search-row route-search-row-functional">
            <div className="route-location-wrap">
              <div className={`route-location-field ${startLocation ? "filled" : ""}`}>
                <MapPin size={16} />
                <div className="route-location-input-wrap">
                  <span>START</span>
                  <input
                    value={startQuery}
                    onChange={(event) => {
                      setStartQuery(event.target.value);
                      if (startLocation && event.target.value !== startLocation.name) setStartLocation(null);
                    }}
                    placeholder="Search starting point"
                    aria-label="Start location"
                  />
                </div>
                {startLocation ? (
                  <button type="button" className="route-clear-field" onClick={() => { setStartLocation(null); setStartQuery(""); resetRoutesOnly(); }} aria-label="Clear start location">
                    <X size={14} />
                  </button>
                ) : (
                  <button type="button" className="route-use-location" onClick={useCurrentLocation} disabled={locating} title="Use current location">
                    <LocateFixed size={14} />
                  </button>
                )}
              </div>

              {startSuggestions.length > 0 && (
                <div className="route-suggestions">
                  {startSuggestions.map((place) => (
                    <button key={place.id} type="button" onClick={() => chooseStart(place)}>
                      <MapPin size={14} />
                      <span>{place.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchingStart && <div className="route-searching">Searching locations…</div>}
            </div>

            <div className="route-arrow">
              <ArrowRight size={17} />
            </div>

            <div className="route-location-wrap">
              <div className={`route-location-field ${destination ? "filled" : ""}`}>
                <MapPin size={16} />
                <div className="route-location-input-wrap">
                  <span>DESTINATION</span>
                  <input
                    value={destinationQuery}
                    onChange={(event) => {
                      setDestinationQuery(event.target.value);
                      if (destination && event.target.value !== destination.name) setDestination(null);
                    }}
                    placeholder="Search destination"
                    aria-label="Destination"
                  />
                </div>
                {destination && (
                  <button type="button" className="route-clear-field" onClick={() => { setDestination(null); setDestinationQuery(""); resetRoutesOnly(); }} aria-label="Clear destination">
                    <X size={14} />
                  </button>
                )}
              </div>

              {destinationSuggestions.length > 0 && (
                <div className="route-suggestions">
                  {destinationSuggestions.map((place) => (
                    <button key={place.id} type="button" onClick={() => chooseDestination(place)}>
                      <MapPin size={14} />
                      <span>{place.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchingDestination && <div className="route-searching">Searching locations…</div>}
            </div>
          </div>

          <div className="route-action-row">
            <button type="button" className="route-primary-action" onClick={calculateRoutes} disabled={!canCalculate}>
              <Search size={16} />
              {routeLoading ? "Calculating routes…" : "Calculate routes"}
            </button>
            <button type="button" className="route-secondary-action" onClick={clearAll}>
              Clear
            </button>
          </div>

          {(routeError || routeAnalysisError) && (
            <div className="route-error-card" role="alert">
              <span>!</span>
              {routeError || routeAnalysisError}
            </div>
          )}

          {startLocation && destination && (
            <div className="route-selection-summary">
              <div>
                <span>START</span>
                <strong>{startLocation.name}</strong>
              </div>
              <ArrowRight size={15} />
              <div>
                <span>DESTINATION</span>
                <strong>{destination.name}</strong>
              </div>
            </div>
          )}

          <div className="route-hero-stats">
            <div>
              <Leaf size={15} />
              <span>Backend recommendation</span>
              <strong>{recommendedRoute || "Waiting"}</strong>
            </div>
            <div>
              <Clock3 size={15} />
              <span>Estimated travel time</span>
              <strong>{selectedRoute ? formatRouteTime(selectedRoute) : "—"}</strong>
            </div>
            <div>
              <Fuel size={15} />
              <span>Predicted route fuel</span>
              <strong>
                {recommendedRoute
                  ? `${Number(
                      backendRecommendedIndex === 0
                        ? routeA.estimated_fuel_litres || 0
                        : routeB.estimated_fuel_litres || 0
                    ).toFixed(3)} L`
                  : "—"}
              </strong>
            </div>
          </div>
        </div>

        <div className="route-map-shell">
          <div className="map-topbar">
            <div className="map-live">
              <span />
              OPENSTREETMAP ROUTING
            </div>

            <div className="map-controls">
              <button
                type="button"
                className={liveMode ? "active" : ""}
                onClick={() => setLiveMode((value) => !value)}
                title="Traffic estimate mode"
              >
                <Zap size={14} />
              </button>

              <button
                type="button"
                className={showLayers ? "active" : ""}
                onClick={() => setShowLayers((value) => !value)}
                title="Map layers"
              >
                <Route size={14} />
              </button>
            </div>
          </div>

          <div id="eco-route-map" className="eco-route-map" />

          {!startLocation && !destination && (
            <div className="map-empty-state">
              <div className="map-empty-icon"><MapPin size={20} /></div>
              <strong>Select your journey</strong>
              <span>Choose a start and destination to calculate real route geometry.</span>
            </div>
          )}

          {startLocation && !routeOptions.length && !routeLoading && (
            <div className="map-empty-state map-empty-state-small">
              <div className="map-empty-icon"><Navigation size={18} /></div>
              <strong>Ready for routing</strong>
              <span>Click Calculate routes after selecting both locations.</span>
            </div>
          )}

          <div className="map-status-card">
            <div className="map-status-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <span>AI ROUTE ENGINE</span>
              <strong>
                {analyzingRoutes || loading
                  ? "Analyzing selected routes…"
                  : recommendedRoute
                    ? `Backend recommendation: ${recommendedRoute}`
                    : hasTwoRoutes
                      ? "Two routes ready for EcoDrive analysis"
                      : "Waiting for two selected locations"}
              </strong>
            </div>
          </div>

          {showLayers && (
            <div className="map-layers">
              <span>MAP LAYERS</span>
              <button type="button" className="selected"><i /> Route alternatives <Check size={13} /></button>
              <button type="button"><i className="traffic-dot" /> Traffic estimate</button>
              <button type="button"><i className="weather-dot" /> Weather <small>visual only</small></button>
            </div>
          )}

          {selectedRoute && (
            <div className="map-route-summary">
              <div>
                <span>SELECTED ROUTE</span>
                <strong>{selectedRoute.name}</strong>
              </div>
              <div className="map-score">
                <span>ECO</span>
                <strong>{getRouteScore(selectedRoute, bestDistance)}</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="route-content">
        <div className="route-heading">
          <div>
            <span>ROUTE COMPARISON</span>
            <h2>{hasTwoRoutes ? "Two routes. One data-driven choice." : "Select a journey to compare."}</h2>
          </div>

          <div className="route-heading-note">
            <CloudRain size={15} />
            Traffic is an estimate unless supplied by live telemetry
          </div>
        </div>

        {!routeOptions.length && (
          <div className="route-empty-comparison">
            <div className="route-empty-icon"><Search size={19} /></div>
            <div>
              <strong>No route comparison yet</strong>
              <p>Search for your starting point and destination above, then calculate routes. EcoDrive will not recommend a route before the locations are selected.</p>
            </div>
          </div>
        )}

        {routeOptions.length > 0 && (
          <>
            <div className="route-cards route-cards-functional">
              {routeOptions.map((route, index) => {
                const active = route.id === selectedRouteId;
                const backendRoute = index === 0 ? routeA : routeB;
                const isRecommended = recommendedRoute === route.name;

                return (
                  <article
                    key={route.id}
                    className={`route-card ${active ? "active" : ""} ${isRecommended ? "backend-recommended" : ""}`}
                    onClick={() => setSelectedRouteId(route.id)}
                  >
                    <div className="route-card-top">
                      <div>
                        <span className="route-card-tag">{isRecommended ? "BACKEND RECOMMENDED" : index === 0 ? "PRIMARY ALTERNATIVE" : "ALTERNATIVE"}</span>
                        <h3>{route.name}</h3>
                      </div>

                      {active && (
                        <div className="route-selected">
                          <Check size={12} />
                          Selected
                        </div>
                      )}
                    </div>

                    <p>{isRecommended ? "EcoDrive selected this route from the backend route comparison." : "Alternative route returned by the routing service."}</p>

                    <div className="route-card-metrics">
                      <div>
                        <span>DISTANCE</span>
                        <strong>{formatDistance(route.distanceKm)}</strong>
                      </div>
                      <div>
                        <span>TIME</span>
                        <strong>{formatRouteTime(route)}</strong>
                      </div>
                      <div>
                        <span>TRAFFIC ESTIMATE</span>
                        <select
                          value={route.traffic}
                          onChange={(event) => {
                            event.stopPropagation();
                            updateTraffic(route.id, event.target.value);
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {trafficOptions.map((traffic) => (
                            <option key={traffic} value={traffic}>{titleCase(traffic)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {backendRoutes && (
                      <div className="route-impact">
                        <div>
                          <Fuel size={15} />
                          <span>Fuel</span>
                          <strong>{Number(backendRoute.estimated_fuel_litres || 0).toFixed(3)} L</strong>
                        </div>
                        <div>
                          <Leaf size={15} />
                          <span>CO₂</span>
                          <strong>{Number(backendRoute.estimated_co2_kg || 0).toFixed(3)} kg</strong>
                        </div>
                        <div className="route-saving">
                          <TrendingDown size={15} />
                          <span>Cost</span>
                          <strong>₹{Number(backendRoute.estimated_fuel_cost || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedRouteId(route.id);
                      }}
                    >
                      Select this route
                      <ArrowRight size={14} />
                    </button>
                  </article>
                );
              })}
            </div>

            {hasTwoRoutes && (
              <div className="route-backend-action">
                <div>
                  <span>ECODRIVE BACKEND</span>
                  <strong>Compare these two actual route distances</strong>
                  <p>Traffic values are user-selected prototype estimates. The backend calculates fuel, cost and CO₂ using your project model.</p>
                </div>
                <button type="button" onClick={analyzeRoutes} disabled={analyzingRoutes || loading}>
                  <Sparkles size={16} />
                  {analyzingRoutes || loading ? "Analyzing…" : "Analyze with EcoDrive AI"}
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {recommendedRoute && (
              <div className="route-result-banner">
                <div className="route-result-icon"><Sparkles size={18} /></div>
                <div>
                  <span>BACKEND ROUTE DECISION</span>
                  <strong>{recommendedRoute} is recommended by the EcoDrive route engine.</strong>
                  <p>
                    Estimated saving: {Number(backendRoutes?.estimated_fuel_saved_litres || 0).toFixed(3)} L fuel · ₹{Number(backendRoutes?.estimated_cost_saved || 0).toFixed(2)} · {Number(backendRoutes?.estimated_co2_reduction_kg || 0).toFixed(3)} kg CO₂.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="route-insight-grid">
          <article className="route-insight-card route-ai-card">
            <div className="route-ai-glow" />
            <div className="route-ai-icon"><Sparkles size={19} /></div>
            <span>AI ROUTE INSIGHT</span>
            <h3>{recommendedRoute ? `Why ${recommendedRoute}?` : "Why EcoDrive waits first"}</h3>
            <p>
              {recommendedRoute
                ? "The backend compares the selected route distances and traffic assumptions, then chooses the lower estimated CO₂ route."
                : "The system does not invent a route recommendation. It waits for your start and destination, calculates route alternatives, and only then asks the EcoDrive backend to compare them."}
            </p>
            <div className="route-ai-pills">
              <span><Leaf size={12} /> Fuel-aware</span>
              <span><TrendingDown size={12} /> CO₂-aware</span>
              <span><Navigation size={12} /> Location-based</span>
            </div>
          </article>

          <article className="route-insight-card route-profile-card">
            <div className="route-panel-heading">
              <div>
                <span>TRIP PROFILE</span>
                <h3>{recommendedRoute ? "What the backend calculated" : "Waiting for your journey"}</h3>
              </div>
              <CarFront size={18} />
            </div>

            <div className="profile-row">
              <div>
                <span>Route A distance</span>
                <strong>{routeOptions[0] ? formatDistance(routeOptions[0].distanceKm) : "—"}</strong>
              </div>
              <div className="profile-bar"><i style={{ width: `${routeOptions[0] ? Math.max(20, getRouteScore(routeOptions[0], bestDistance)) : 0}%` }} /></div>
            </div>

            <div className="profile-row">
              <div>
                <span>Route B distance</span>
                <strong>{routeOptions[1] ? formatDistance(routeOptions[1].distanceKm) : "—"}</strong>
              </div>
              <div className="profile-bar"><i style={{ width: `${routeOptions[1] ? Math.max(20, getRouteScore(routeOptions[1], bestDistance)) : 0}%` }} /></div>
            </div>

            <div className="profile-row">
              <div>
                <span>Fuel saved</span>
                <strong>{recommendedRoute ? `${Number(backendRoutes?.estimated_fuel_saved_litres || 0).toFixed(3)} L` : "—"}</strong>
              </div>
              <div className="profile-bar"><i style={{ width: `${recommendedRoute ? Math.min(100, Math.max(10, Number(backendRoutes?.estimated_fuel_saved_litres || 0) * 20)) : 0}%` }} /></div>
            </div>
          </article>
        </div>

        <div className="route-prototype-note">
          <span>Prototype route analysis</span>
          <p>
            Map geometry comes from OpenStreetMap/OSRM. EcoDrive's fuel, cost and CO₂ comparison is calculated by your local deterministic backend. Traffic is not live unless connected to a separate live-traffic provider.
          </p>
        </div>
      </section>
    </main>
  );
}
