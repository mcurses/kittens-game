// SessionsPanel — admin interface for session management
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useSlot } from "./SlotContext.js";

interface SlotMeta {
  slot: string;
  status: "active" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
  multiplier?: number;
}

const SLOT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const SPEED_MIN = 1;
const SPEED_MAX = 500;

function parseSpeedInput(raw: string): { ok: true; value: number } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false };
  const floored = Math.floor(n);
  if (floored < SPEED_MIN || floored > SPEED_MAX) return { ok: false };
  return { ok: true, value: floored };
}
const STATUS_PRIORITY: Record<SlotMeta["status"], number> = {
  active: 0,
  paused: 1,
  archived: 2,
};

function getStatusSymbol(status: string): string {
  switch (status) {
    case "active":
      return "●";
    case "paused":
      return "⏸";
    case "archived":
      return "▪";
    default:
      return " ";
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "status-active";
    case "paused":
      return "status-paused";
    case "archived":
      return "status-archived";
    default:
      return "";
  }
}

function getStatusLabel(status: SlotMeta["status"]): string {
  switch (status) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "archived":
      return "Archived";
  }
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

async function fetchSessions(): Promise<SlotMeta[]> {
  const response = await fetch("/api/sessions");
  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }
  const data = (await response.json()) as { sessions: SlotMeta[] };
  return data.sessions;
}

function sortSessions(sessions: SlotMeta[]): SlotMeta[] {
  return [...sessions].sort((a, b) => {
    const statusDelta = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }
    return b.updatedAt - a.updatedAt;
  });
}

export function SessionsPanel(): React.ReactElement {
  const _slot = useSlot();
  const queryClient = useQueryClient();
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    refetchInterval: 5000, // Poll every 5s
  });
  const { data: demoSaves = [] } = useQuery({
    queryKey: ["demo-saves"],
    queryFn: async (): Promise<Array<{ name: string; description: string }>> => {
      try {
        const response = await fetch("/api/demo-saves");
        if (!response?.ok) return [];
        const json = await response.json() as { ok?: boolean; saves?: Array<{ name: string; description: string }> };
        return json.saves ?? [];
      } catch {
        return [];
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const [newSlotName, setNewSlotName] = React.useState("");
  const [newSlotError, setNewSlotError] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<{
    action: "archive" | "delete";
    slot: string;
  } | null>(null);
  const visibleSessions = React.useMemo(() => {
    const filtered = showArchived
      ? sessions
      : sessions.filter((session) => session.status !== "archived");
    return sortSessions(filtered);
  }, [sessions, showArchived]);

  const handleCreateSession = async () => {
    if (!SLOT_PATTERN.test(newSlotName)) {
      setNewSlotError(
        "Invalid slot name. Use alphanumeric characters, dashes, or underscores (1-64 chars).",
      );
      return;
    }

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: newSlotName }),
      });

      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        setNewSlotError(errData.error || `Error: ${response.status}`);
        return;
      }

      setNewSlotName("");
      setNewSlotError("");
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      setNewSlotError(err instanceof Error ? err.message : "Failed to create session");
    }
  };

  const handlePauseSession = async (slotName: string) => {
    try {
      const response = await fetch(`/api/sessions/${slotName}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to pause session: ${response.status}`);
      }

      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Pause failed:", err);
    }
  };

  const handleResumeSession = async (slotName: string) => {
    try {
      const response = await fetch(`/api/sessions/${slotName}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to resume session: ${response.status}`);
      }

      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Resume failed:", err);
    }
  };

  const handleLoadDemo = async (slotName: string, demoName: string) => {
    if (!demoName) return;
    try {
      const response = await fetch(`/api/sessions/${slotName}/load-demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: demoName }),
      });
      if (!response.ok) {
        throw new Error(`Failed to load demo: ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Load demo failed:", err);
    }
  };

  const handleArchiveSession = async (slotName: string) => {
    try {
      const response = await fetch(`/api/sessions/${slotName}/archive`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Failed to archive session: ${response.status}`);
      }

      setConfirmAction(null);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  const handleDeleteSession = async (slotName: string) => {
    try {
      const response = await fetch(`/api/sessions/${slotName}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.status}`);
      }

      setConfirmAction(null);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleExportSession = async (slotName: string) => {
    try {
      const response = await fetch(`/api/sessions/${slotName}/export`);

      if (!response.ok) {
        throw new Error(`Failed to export session: ${response.status}`);
      }

      const stateJson = await response.text();
      const blob = new Blob([stateJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slotName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleOpenSession = (slotName: string) => {
    window.location.assign(`/?slot=${encodeURIComponent(slotName)}`);
  };

  const handleApplySpeed = async (slotName: string, multiplier: number) => {
    try {
      const response = await fetch(`/api/sessions/${slotName}/speed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ multiplier }),
      });
      if (!response.ok) {
        throw new Error(`Failed to set speed: ${response.status}`);
      }
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    } catch (err) {
      console.error("Set speed failed:", err);
    }
  };

  if (isLoading) {
    return <div className="sessions-panel">Loading sessions...</div>;
  }

  if (error) {
    return (
      <div className="sessions-panel error">
        Error: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="sessions-panel">
      <h2>Sessions</h2>

      {/* Create new session */}
      <div className="sessions-create">
        <input
          type="text"
          placeholder="New session name"
          value={newSlotName}
          onChange={(e) => {
            setNewSlotName(e.target.value);
            setNewSlotError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateSession();
            }
          }}
          disabled={isLoading}
        />
        <button
          type="button"
          className="btn btn--sm btn--primary"
          onClick={handleCreateSession}
          disabled={isLoading || !newSlotName.trim()}
        >
          Create
        </button>
        {newSlotError && <div className="error-msg">{newSlotError}</div>}
      </div>

      <label className="sessions-filter">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
        />
        <span>Show archived</span>
      </label>

      {/* Sessions table */}
      <table className="sessions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Last Saved</th>
            <th>Speed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleSessions.map((session) => (
            <tr key={session.slot} data-slot={session.slot}>
              <td className="slot-name">{session.slot}</td>
              <td className={`status-cell ${getStatusClass(session.status)}`}>
                <span className="status-symbol">{getStatusSymbol(session.status)}</span>
                <span className="status-label">{getStatusLabel(session.status)}</span>
              </td>
              <td className="last-saved">{formatDate(session.updatedAt)}</td>
              <td className="speed-cell">
                {session.status === "archived" ? (
                  <span className="speed-na">—</span>
                ) : (
                  <SpeedControl
                    slot={session.slot}
                    current={session.multiplier ?? 1}
                    onApply={handleApplySpeed}
                  />
                )}
              </td>
              <td className="actions-cell">
                {session.status === "active" && (
                  <>
                    <button
                      type="button"
                      title="Open session"
                      className="btn btn--xs btn--success"
                      onClick={() => handleOpenSession(session.slot)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      title="Pause session"
                      className="btn btn--xs btn--warning"
                      onClick={() => handlePauseSession(session.slot)}
                    >
                      Pause
                    </button>
                  </>
                )}

                {session.status === "paused" && (
                  <>
                    <button
                      type="button"
                      title="Open session (read-only)"
                      className="btn btn--xs btn--success"
                      onClick={() => handleOpenSession(session.slot)}
                    >
                      Open (R/O)
                    </button>
                    <button
                      type="button"
                      title="Resume session"
                      className="btn btn--xs btn--success"
                      onClick={() => handleResumeSession(session.slot)}
                    >
                      Resume
                    </button>
                  </>
                )}

                <button
                  type="button"
                  title="Archive session"
                  className="btn btn--xs btn--warning"
                  onClick={() => setConfirmAction({ action: "archive", slot: session.slot })}
                >
                  Archive
                </button>

                <button
                  type="button"
                  title="Export session"
                  className="btn btn--xs btn--info"
                  onClick={() => handleExportSession(session.slot)}
                >
                  Export
                </button>

                {demoSaves.length > 0 && (
                  <select
                    className="btn btn--xs btn--info"
                    title="Replace this session's state with a demo save"
                    defaultValue=""
                    onChange={(e) => {
                      const name = e.target.value;
                      e.target.value = "";
                      if (name) handleLoadDemo(session.slot, name);
                    }}
                  >
                    <option value="">Load demo …</option>
                    {demoSaves.map((d) => (
                      <option key={d.name} value={d.name} title={d.description}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  title="Delete session"
                  className="btn btn--xs btn--danger"
                  onClick={() => setConfirmAction({ action: "delete", slot: session.slot })}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {visibleSessions.length === 0 && (
        <p className="no-sessions">No sessions yet. Create one to get started.</p>
      )}

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p>
              Are you sure you want to {confirmAction.action === "archive" ? "archive" : "delete"} "
              {confirmAction.slot}"?
            </p>
            {confirmAction.action === "archive" && (
              <div className="confirm-detail">
                <p>Archived sessions are frozen and removed from the openable session list.</p>
                <p>You can still delete them later.</p>
              </div>
            )}
            <div className="confirm-buttons">
              <button
                type="button"
                className="btn btn--sm btn--danger btn--solid"
                onClick={() => {
                  if (confirmAction.action === "archive") {
                    handleArchiveSession(confirmAction.slot);
                  } else {
                    handleDeleteSession(confirmAction.slot);
                  }
                }}
              >
                Confirm
              </button>
              <button
                type="button"
                className="btn btn--sm btn--secondary"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SpeedControlProps {
  slot: string;
  current: number;
  onApply: (slot: string, multiplier: number) => Promise<void>;
}

function SpeedControl({ slot, current, onApply }: SpeedControlProps): React.ReactElement {
  const [draft, setDraft] = React.useState<string>(String(current));
  const lastSyncedRef = React.useRef<number>(current);

  // Sync draft when server value changes (e.g. after invalidate) — but only if
  // the user isn't mid-edit. We compare against the last value we synced from.
  React.useEffect(() => {
    if (current !== lastSyncedRef.current) {
      setDraft(String(current));
      lastSyncedRef.current = current;
    }
  }, [current]);

  const parsed = parseSpeedInput(draft);
  const dirty = parsed.ok ? parsed.value !== current : draft !== String(current);
  const canApply = parsed.ok && dirty;

  const handleSubmit = () => {
    if (!parsed.ok) return;
    void onApply(slot, parsed.value);
  };

  return (
    <div className="speed-control">
      <input
        type="number"
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canApply) {
            handleSubmit();
          }
        }}
        className={`speed-input${parsed.ok ? "" : " speed-input--invalid"}`}
        aria-label={`Speed multiplier for ${slot}`}
        title={`Range ${SPEED_MIN}–${SPEED_MAX}`}
        data-testid={`speed-input-${slot}`}
      />
      <span className="speed-x">×</span>
      <button
        type="button"
        className="btn btn--xs btn--primary"
        disabled={!canApply}
        onClick={handleSubmit}
        title={`Apply speed for ${slot}`}
        data-testid={`speed-apply-${slot}`}
      >
        Apply
      </button>
    </div>
  );
}
