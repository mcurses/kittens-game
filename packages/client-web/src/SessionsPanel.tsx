// SessionsPanel — admin interface for session management
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useSlot } from "./SlotContext.js";

interface SlotMeta {
  slot: string;
  status: "active" | "paused" | "archived";
  createdAt: number;
  updatedAt: number;
}

const SLOT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
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
  const slot = useSlot();
  const queryClient = useQueryClient();
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    refetchInterval: 5000, // Poll every 5s
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
      setNewSlotError(
        err instanceof Error ? err.message : "Failed to create session",
      );
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
                  onClick={() =>
                    setConfirmAction({ action: "archive", slot: session.slot })
                  }
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

                <button
                  type="button"
                  title="Delete session"
                  className="btn btn--xs btn--danger"
                  onClick={() =>
                    setConfirmAction({ action: "delete", slot: session.slot })
                  }
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
              Are you sure you want to{" "}
              {confirmAction.action === "archive" ? "archive" : "delete"}{" "}
              "{confirmAction.slot}"?
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
