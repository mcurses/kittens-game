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
export async function fetchGameState(): Promise<GameStateResponse> {
  const res = await fetch(`${BASE_URL}/api/game/state`);
  if (!res.ok) throw new Error(`Failed to fetch game state: ${res.status}`);
  return res.json() as Promise<GameStateResponse>;
}

/** POST /api/game/action */
export async function postGameAction(action: {
  type: string;
  [key: string]: unknown;
}): Promise<ActionResult> {
  const res = await fetch(`${BASE_URL}/api/game/action`, {
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
