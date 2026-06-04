// Select — styled `<select>` carrying the design-system `.btn-select` class.
// Use this instead of raw `<select className="btn-select">`.
import React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<SelectOption>;
  className?: string;
  "data-testid"?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  className,
  disabled,
  ...rest
}: Props): React.ReactElement {
  const classes = className ? `btn-select ${className}` : "btn-select";
  return (
    <select
      className={classes}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      data-testid={rest["data-testid"]}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
