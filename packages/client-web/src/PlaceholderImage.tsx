import React from "react";

/**
 * Shared image slot with a "we'll fill this in later" placeholder.
 *
 * - `variant` selects the aspect ratio + default fill (square for building/character,
 *   2:3 portrait for book covers).
 * - `src` is optional. If absent, the placeholder shows. If present but the asset
 *   404s, the placeholder shows (graceful fallback via onError).
 * - Size is driven by CSS custom property `--placeholder-size` on the parent
 *   (set globally by useCardSize → data-card-size on <html>).
 */

export type PlaceholderVariant = "building" | "character" | "book" | "job" | "map";

export interface PlaceholderImageProps {
  variant: PlaceholderVariant;
  src?: string;
  alt?: string;
  className?: string;
}

export function PlaceholderImage({
  variant,
  src,
  alt = "",
  className,
}: PlaceholderImageProps): React.ReactElement {
  const [imgFailed, setImgFailed] = React.useState(false);

  const classes = [
    "placeholder-image",
    `placeholder-image--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const showImage = src !== undefined && !imgFailed;

  return (
    <div className={classes} data-testid="placeholder-image" data-variant={variant}>
      {showImage && (
        <img
          src={src}
          alt={alt}
          className="placeholder-image__img"
          onError={() => setImgFailed(true)}
          data-testid="placeholder-image-img"
        />
      )}
    </div>
  );
}
