// Modal dialog for renaming the village. Recycles the .confirm-overlay /
// .confirm-dialog pattern already used by SessionsPanel.
import React, { useState } from "react";

interface Props {
  currentName: string;
  onCancel: () => void;
  onConfirm: (newName: string) => void;
}

const MAX_LEN = 40;
const ALLOWED = /^[\p{L}\p{N} '\-]+$/u;

export function RenameVillageDialog({
  currentName,
  onCancel,
  onConfirm,
}: Props): React.ReactElement {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError("Name cannot be empty.");
      return;
    }
    if (trimmed.length > MAX_LEN) {
      setError(`Name must be ${MAX_LEN} characters or fewer.`);
      return;
    }
    if (!ALLOWED.test(trimmed)) {
      setError("Only letters, numbers, spaces, apostrophes and dashes.");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div className="confirm-overlay" data-testid="rename-village-overlay">
      <div className="confirm-dialog">
        <p>Rename your village.</p>
        <input
          type="text"
          className="rename-village__input"
          value={value}
          maxLength={MAX_LEN}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") onCancel();
          }}
        />
        {error && (
          <p className="status-message status-message--error" data-testid="rename-village-error">
            {error}
          </p>
        )}
        <div className="confirm-buttons">
          <button
            type="button"
            data-testid="rename-village-confirm"
            className="btn btn--sm btn--primary"
            onClick={handleConfirm}
          >
            Save
          </button>
          <button
            type="button"
            data-testid="rename-village-cancel"
            className="btn btn--sm btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
