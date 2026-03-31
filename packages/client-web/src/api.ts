// API client — typed fetch functions for all server endpoints
import type {
  ActionResult,
  GameResetRequest,
  GameStateResponse,
  HealthResponse,
  SaveExportResponse,
  SaveImportRequest,
} from "@kittens/api-spec";

const BASE_URL = "";

/** GET /api/health */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}

/** GET /api/game/state */
export async function fetchGameState(slot = "default"): Promise<GameStateResponse> {
  const suffix = slot !== "default" ? `?slot=${slot}` : "";
  const res = await fetch(`${BASE_URL}/api/game/state${suffix}`);
  if (!res.ok) throw new Error(`Failed to fetch game state: ${res.status}`);
  return res.json() as Promise<GameStateResponse>;
}

/** POST /api/game/action */
export async function postGameAction(
  action: { type: string; [key: string]: unknown },
  slot = "default",
): Promise<ActionResult> {
  const suffix = slot !== "default" ? `?slot=${slot}` : "";
  const res = await fetch(`${BASE_URL}/api/game/action${suffix}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  // Action endpoint returns 200 or 400 with ActionResult either way
  return res.json() as Promise<ActionResult>;
}

/** GET /api/game/save */
export async function fetchSave(): Promise<SaveExportResponse> {
  const res = await fetch(`${BASE_URL}/api/game/save`);
  if (!res.ok) throw new Error(`Failed to fetch save: ${res.status}`);
  return res.json() as Promise<SaveExportResponse>;
}

/** POST /api/game/load */
export async function postLoad(
  request: SaveImportRequest,
): Promise<GameStateResponse> {
  const res = await fetch(`${BASE_URL}/api/game/load`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Failed to load save: ${res.status}`);
  return res.json() as Promise<GameStateResponse>;
}

/** POST /api/game/reset */
export async function postReset(
  request?: GameResetRequest,
): Promise<GameStateResponse> {
  const res = await fetch(`${BASE_URL}/api/game/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request ?? {}),
  });
  if (!res.ok) throw new Error(`Failed to reset game: ${res.status}`);
  return res.json() as Promise<GameStateResponse>;
}

/** POST /api/game/import-legacy */
export async function postImportLegacy(
  data: string,
  slot = "default",
): Promise<GameStateResponse> {
  const suffix = slot !== "default" ? `?slot=${slot}` : "";
  const res = await fetch(`${BASE_URL}/api/game/import-legacy${suffix}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Import failed: ${res.status}`);
  }
  return res.json() as Promise<GameStateResponse>;
}
