import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const routePoints = [
  [17.7143, 83.3010],
  [17.7202, 83.3047],
  [17.7281, 83.3112],
  [17.7357, 83.3189],
  [17.7416, 83.3263],
  [17.7502, 83.3322],
];

function markerIcon(type) {
  const className = type === 'start' ? 'real-map-marker real-map-marker-start' : 'real-map-marker real-map-marker-end';
  const label = type === 'start' ? 'S' : 'E';

  return L.divIcon({
    className: '',
    html: `<div class="${className}"><span>${label}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function RealMap({ className = '', zoom = 13 }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined;

    const map = L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView(routePoints[0], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.polyline(routePoints, {
      color: '#39dca0',
      weight: 5,
      opacity: 0.96,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    L.marker(routePoints[0], { icon: markerIcon('start') }).addTo(map);
    L.marker(routePoints[routePoints.length - 1], { icon: markerIcon('end') }).addTo(map);

    map.fitBounds(routePoints, { padding: [24, 24] });
    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 80);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, [zoom]);

  return <div ref={mapElementRef} className={`real-map ${className}`} aria-label="Interactive real-world map" />;
}
