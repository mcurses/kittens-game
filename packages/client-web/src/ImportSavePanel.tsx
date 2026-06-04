// ImportSavePanel — paste or upload a legacy Kittens Game save string to import it
import { useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import { postImportLegacy } from "./api.js";
import { useSlot } from "./SlotContext.js";
import { GAME_STATE_QUERY_KEY } from "./useGameState.js";

interface Props {
  onClose?: () => void;
}

export function ImportSavePanel({ onClose }: Props): React.ReactElement {
  const slot = useSlot();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await postImportLegacy(text.trim(), slot);
      await queryClient.invalidateQueries({ queryKey: [...GAME_STATE_QUERY_KEY, slot] });
      setStatus("success");
      setText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="import-save-panel">
      <h3 className="panel-subheading">Import Legacy Save</h3>
      <p className="import-save-hint">
        Paste a legacy Kittens Game save string, or upload a .txt export file.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.json"
        data-testid="import-save-file"
        onChange={handleFileChange}
        className="import-save-file"
      />

      <textarea
        data-testid="import-save-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste save string here…"
        rows={4}
        className="import-save-textarea"
      />

      <div className="import-save-actions">
        <button
          type="submit"
          data-testid="import-save-btn"
          disabled={status === "loading" || !text.trim()}
          className="btn btn--sm btn--primary"
        >
          {status === "loading" ? "Importing…" : "Import Save"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn--sm btn--secondary"
          >
            Cancel
          </button>
        )}
      </div>

      {status === "success" && (
        <p
          data-testid="import-save-success"
          className="status-message status-message--success"
        >
          Save imported successfully.
        </p>
      )}
      {status === "error" && (
        <p
          data-testid="import-save-error"
          className="status-message status-message--error"
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}
