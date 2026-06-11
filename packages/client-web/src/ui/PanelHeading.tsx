// PanelHeading — typed wrapper over the three-rank heading hierarchy.
//
// Level 2 → `.panel-label`   (Tab-Top heading, bordered)
// Level 3 → `.panel-subheading` (Group heading, e.g. "Food Production")
// Level 4 → `.panel-sublabel` (Sub-section label, e.g. "Census")
//
// Use this instead of raw `<div className="panel-label">` so the schema stays
// enforceable from the JSX side. The `as` prop lets callers pick a semantic
// element (`<h2>`, `<h3>`, …) without changing the visual class.

import type React from "react";

interface Props {
  level: 2 | 3 | 4;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
  // Pass-through for data-testid + aria attrs.
  [key: `data-${string}`]: unknown;
  [key: `aria-${string}`]: unknown;
}

const CLASS_BY_LEVEL: Record<2 | 3 | 4, string> = {
  2: "panel-label",
  3: "panel-subheading",
  4: "panel-sublabel",
};

export function PanelHeading({
  level,
  as,
  className,
  children,
  ...rest
}: Props): React.ReactElement {
  const Tag = (as ?? "div") as React.ElementType;
  const classes = className ? `${CLASS_BY_LEVEL[level]} ${className}` : CLASS_BY_LEVEL[level];
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
