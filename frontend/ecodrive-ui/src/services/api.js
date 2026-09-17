const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'https://vehicle-carbon-agent.onrender.com';

export const DEFAULT_ANALYSIS_PAYLOAD = {
  mileage_km_per_litre: 18,
  fuel_type: 'petrol',
  vehicle_age_years: 4,

  average_speed_kmh: 45,
  max_speed_kmh: 80,

  hard_accelerations: 3,
  hard_brakings: 2,
  idle_minutes: 5,

  ac_usage: 'moderate',
  traffic_level: 'moderate',
  vehicle_load: 'normal',

  acceleration_mps2: 1.1,
  braking_mps2: 1.0,

  distance_km: 18.6,
  road_type: 'mixed',

  fuel_price_per_litre: 105,

  route_a_distance_km: 12.4,
  route_a_traffic_level: 'moderate',

  route_b_distance_km: 14.1,
  route_b_traffic_level: 'low',
};


/* =========================================================
   COMMON API REQUEST
   ========================================================= */

async function request(path, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail =
      typeof body?.detail === 'string'
        ? body.detail
        : body?.detail?.message ||
          body?.message;

    throw new Error(
      detail ||
      `EcoDrive API request failed (${response.status})`
    );
  }

  return body;
}


/* =========================================================
   BACKEND HEALTH CHECK
   ========================================================= */

export async function healthCheck() {
  return request('/api/health');
}


/* =========================================================
   COMPLETE ECO DRIVE ANALYSIS
   ========================================================= */

export async function analyzeEcoDrive(payload = {}) {
  return request(
    '/api/eco-drive/analyze',
    {
      method: 'POST',
      body: JSON.stringify({
        ...DEFAULT_ANALYSIS_PAYLOAD,
        ...payload,
      }),
    }
  );
}


/* =========================================================
   AI ASSISTANT CHAT
   ========================================================= */

export async function chatWithEcoDriveAgent({
  message,
  analysis = null,
  context = {},
  sessionId = 'ecodrive-web-session',
} = {}) {
  if (!message || !message.trim()) {
    throw new Error(
      'Please enter a message.'
    );
  }

  return request(
    '/api/eco-drive/chat',
    {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
        session_id: sessionId,
        analysis,
        context,
      }),
    }
  );
}


/* =========================================================
   JSON DOWNLOAD
   ========================================================= */

export function downloadJson(
  filename,
  data
) {
  const blob = new Blob(
    [
      JSON.stringify(
        data,
        null,
        2
      ),
    ],
    {
      type: 'application/json',
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement('a');

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}


/* =========================================================
   ECO PERFORMANCE REPORT DOWNLOAD
   ========================================================= */

export function downloadEcoReport(
  result
) {
  const summary =
    result?.summary ||
    result?.pipeline?.summary ||
    {};

  const text = [
    'ECODRIVE AI — ECO PERFORMANCE REPORT',
    '====================================',
    '',

    `Eco Performance Score: ${
      summary.eco_performance_score ??
      'N/A'
    }/100`,

    `Rating: ${
      summary.eco_performance_rating ??
      'N/A'
    }`,

    `Driving Score: ${
      summary.driving_score ??
      'N/A'
    }/100`,

    `Fuel Efficiency: ${
      summary.equivalent_fuel_efficiency_kmpl ??
      'N/A'
    } km/L`,

    `Predicted Consumption: ${
      summary.predicted_fuel_consumption_l_per_100km ??
      'N/A'
    } L/100 km`,

    `Trip Fuel: ${
      summary.estimated_trip_fuel_litres ??
      'N/A'
    } L`,

    `Trip Cost: ₹${
      summary.estimated_trip_cost ??
      'N/A'
    }`,

    `Trip CO2: ${
      summary.estimated_trip_co2_kg ??
      'N/A'
    } kg`,

    `Recommended Route: ${
      summary.recommended_route ??
      'N/A'
    }`,

    `Route Fuel Saved: ${
      summary.route_fuel_saved_litres ??
      'N/A'
    } L`,

    `Route CO2 Reduction: ${
      summary.route_co2_reduction_kg ??
      'N/A'
    } kg`,

    '',

    'This report contains prototype project estimates.',
  ].join('\n');

  const blob = new Blob(
    [text],
    {
      type: 'text/plain;charset=utf-8',
    }
  );

  const url =
    URL.createObjectURL(blob);

  const anchor =
    document.createElement('a');

  anchor.href = url;
  anchor.download =
    'ecodrive-report.txt';

  document.body.appendChild(
    anchor
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(url);
}


/* =========================================================
   API BASE URL
   ========================================================= */

export {
  API_BASE_URL,
};


/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default {
  healthCheck,
  analyzeEcoDrive,
  chatWithEcoDriveAgent,
  downloadJson,
  downloadEcoReport,
  DEFAULT_ANALYSIS_PAYLOAD,
};