// Toggle — labeled checkbox in the design-system `.toggle-label` style.
// Use this instead of raw `<label className="toggle-label"><input … /></label>`.
import type React from "react";

interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  "data-testid"?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled, ...rest }: Props): React.ReactElement {
  return (
    <label
      className="toggle-label"
      data-testid={rest["data-testid"] ? `${rest["data-testid"]}-label` : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        {...(rest["data-testid"] ? { "data-testid": rest["data-testid"] } : {})}
      />
      {label}
    </label>
  );
}
