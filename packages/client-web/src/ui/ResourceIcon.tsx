// ResourceIcon — single primitive for rendering a resource/job/craft icon.
//
// Resolution order:
//   1. If the sprite entry has `iconPath` AND the asset loads → <img>.
//   2. Otherwise → Unicode glyph fallback styled with the sprite color.
//   3. If neither is known → render the raw `name` (still legible, ugly).
//
// Falling back to a glyph keeps the UI working while we generate the WEBPs
// incrementally; no flash of empty space when assets are 404.
import React from "react";
import { RESOURCE_SPRITES } from "../resourceSprites.js";
import { JOB_SPRITES } from "../jobSprites.js";

export type ResourceIconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface Props {
  name: string;
  size?: ResourceIconSize;
  className?: string;
  "aria-label"?: string;
}

export function ResourceIcon({
  name,
  size = "sm",
  className,
  "aria-label": ariaLabel,
}: Props): React.ReactElement {
  const sprite = RESOURCE_SPRITES[name] ?? JOB_SPRITES[name];
  const [imgFailed, setImgFailed] = React.useState(false);

  const classes = `resource-icon resource-icon--${size}${className ? ` ${className}` : ""}`;
  const label = ariaLabel ?? name;

  const useImg = sprite?.iconPath !== undefined && !imgFailed;

  if (useImg) {
    return (
      <img
        src={sprite!.iconPath}
        alt=""
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
        title={label}
        className={classes}
        onError={() => setImgFailed(true)}
        data-testid={`resource-icon-${name}`}
      />
    );
  }

  if (sprite) {
    return (
      <span
        className={classes}
        style={{ color: sprite.color }}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
        title={label}
        data-testid={`resource-icon-${name}`}
      >
        {sprite.glyph}
      </span>
    );
  }

  return (
    <span
      className={classes}
      aria-hidden="true"
      title={label}
      data-testid={`resource-icon-${name}`}
    >
      •
    </span>
  );
}
