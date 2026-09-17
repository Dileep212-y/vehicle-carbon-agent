import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { analyzeEcoDrive, healthCheck, DEFAULT_ANALYSIS_PAYLOAD } from "../services/api";

const STORAGE_KEY = "ecodrive:last-analysis";
const PAYLOAD_KEY = "ecodrive:last-analysis-payload";
const HISTORY_KEY = "ecodrive:analysis-history";

const EcoDriveContext = createContext(null);

function loadStoredValue(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadStoredAnalysis() {
  return loadStoredValue(STORAGE_KEY, null);
}

function loadStoredPayload() {
  return loadStoredValue(PAYLOAD_KEY, { ...DEFAULT_ANALYSIS_PAYLOAD });
}

export function EcoDriveProvider({ children }) {
  const [analysis, setAnalysis] = useState(loadStoredAnalysis);
  const [lastPayload, setLastPayload] = useState(loadStoredPayload);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [error, setError] = useState("");
  const [lastRunAt, setLastRunAt] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState(() =>
    loadStoredValue(HISTORY_KEY, [])
  );

  const lastPayloadRef = useRef(lastPayload);
  const hasCheckedBackend = useRef(false);

  useEffect(() => {
    lastPayloadRef.current = lastPayload;
  }, [lastPayload]);

  const runAnalysis = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError("");

    const payload = {
      ...DEFAULT_ANALYSIS_PAYLOAD,
      ...lastPayloadRef.current,
      ...overrides,
    };

    try {
      const result = await analyzeEcoDrive(payload);

      setAnalysis(result);
      setBackendOnline(true);

      setLastPayload(payload);
      lastPayloadRef.current = payload;
      localStorage.setItem(PAYLOAD_KEY, JSON.stringify(payload));

      const timestamp = new Date().toISOString();
      setLastRunAt(timestamp);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

      setAnalysisHistory((current) => {
        const snapshot = {
          id: `RUN-${Date.now()}`,
          createdAt: timestamp,
          payload,
          result,
        };

        const next = [snapshot, ...current].slice(0, 20);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });

      return result;
    } catch (err) {
      setBackendOnline(false);
      setError(err.message || "Unable to connect to EcoDrive backend.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreAnalysis = useCallback((result, payload = {}) => {
    if (!result) return;

    const safePayload = {
      ...DEFAULT_ANALYSIS_PAYLOAD,
      ...payload,
    };

    setAnalysis(result);
    setLastPayload(safePayload);
    lastPayloadRef.current = safePayload;
    setError("");
    setBackendOnline(true);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    localStorage.setItem(PAYLOAD_KEY, JSON.stringify(safePayload));
  }, []);

  useEffect(() => {
    if (hasCheckedBackend.current) return;
    hasCheckedBackend.current = true;

    healthCheck()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const value = {
    analysis,
    lastPayload,
    loading,
    backendOnline,
    error,
    lastRunAt,
    analysisHistory,
    runAnalysis,
    restoreAnalysis,
  };

  return (
    <EcoDriveContext.Provider value={value}>
      {children}
    </EcoDriveContext.Provider>
  );
}

export function useEcoDrive() {
  const context = useContext(EcoDriveContext);

  if (!context) {
    throw new Error("useEcoDrive must be used inside EcoDriveProvider");
  }

  return context;
}
