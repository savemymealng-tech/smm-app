type Detail = Record<string, unknown>;
let started = 0;
let events: { stage: string; elapsedMs: number; details: Detail }[] = [];
export function beginLocationTrace() {
  started = Date.now();
  events = [];
}
export function safeLocationError(error: unknown) {
  const value = error as { code?: unknown; message?: unknown };
  return {
    code: String(value?.code || 'UNKNOWN').slice(0, 100),
    message: String(value?.message || error || 'Unknown location error')
      .replace(/[-+]?\d+\.\d+/g, '[number]')
      .slice(0, 600),
  };
}
export function locationShape(value: unknown) {
  const p = value as {
    coords?: { latitude?: unknown; longitude?: unknown; accuracy?: unknown };
    timestamp?: unknown;
  };
  return {
    received: !!value,
    fields: value && typeof value === 'object' ? Object.keys(value) : [],
    pointFields:
      p?.coords && typeof p.coords === 'object' ? Object.keys(p.coords) : [],
    latType: typeof p?.coords?.latitude,
    lngType: typeof p?.coords?.longitude,
    timestampType: typeof p?.timestamp,
  };
}
export function traceLocation(stage: string, details: Detail = {}) {
  if (!started) return;
  events.push({ stage, elapsedMs: Date.now() - started, details });
  events = events.slice(-40);
}
export function getLocationTrace() {
  return {
    attemptStartedAt: started ? new Date(started).toISOString() : null,
    events: events.map((e) => ({ ...e })),
  };
}
