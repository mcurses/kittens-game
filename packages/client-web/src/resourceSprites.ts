// Unicode-glyph sprites for resources + craft outputs. Used as inline icons in
// craft rows, resource lists, and anywhere we need a tiny visual marker for a
// resource without dragging a real asset in. Pattern mirrors `jobSprites.ts`.
//
// The optional `iconPath` is set for every resource that already has a real
// Higgsfield-generated WEBP under `public/assets/icons/`. The `ResourceIcon`
// component (in `ui/`) prefers the asset, then falls back to `glyph` if the
// asset is missing or 404s. As we generate the rest of the icon set, we just
// flip `iconPath` on for each new entry.

export interface ResourceSprite {
  glyph: string;
  color: string;
  iconPath?: string;
}

export const RESOURCE_SPRITES: Record<string, ResourceSprite> = {
  // Raw resources
  catnip:      { glyph: "🌿", color: "var(--res-catnip)",   iconPath: "/assets/icons/catnip.webp" },
  wood:        { glyph: "🪵", color: "var(--res-wood)",     iconPath: "/assets/icons/wood.webp" },
  gold:        { glyph: "🪙", color: "var(--res-gold)",     iconPath: "/assets/icons/gold.webp" },
  minerals:    { glyph: "🪨", color: "var(--res-minerals)", iconPath: "/assets/icons/minerals.webp" },
  coal:        { glyph: "⬛", color: "var(--ink-2)",        iconPath: "/assets/icons/coal.webp" },
  iron:        { glyph: "⛓",  color: "var(--res-iron)",     iconPath: "/assets/icons/iron.webp" },
  titanium:    { glyph: "◇",  color: "var(--res-iron)",     iconPath: "/assets/icons/titanium.webp" },
  oil:         { glyph: "🛢", color: "var(--ink)",          iconPath: "/assets/icons/oil.webp" },
  uranium:     { glyph: "☢",  color: "var(--green)",        iconPath: "/assets/icons/uranium.webp" },
  unobtainium: { glyph: "✦",  color: "var(--cyber)",        iconPath: "/assets/icons/unobtainium.webp" },
  catpower:    { glyph: "✊", color: "var(--accent)",       iconPath: "/assets/icons/catpower.webp" },
  faith:       { glyph: "☼",  color: "var(--res-faith)",    iconPath: "/assets/icons/faith.webp" },
  science:     { glyph: "🔬", color: "var(--res-science)",  iconPath: "/assets/icons/science.webp" },
  culture:     { glyph: "❀",  color: "var(--accent)",       iconPath: "/assets/icons/culture.webp" },
  manpower:    { glyph: "✊", color: "var(--accent)",       iconPath: "/assets/icons/catpower.webp" },
  furs:        { glyph: "🦊", color: "var(--res-wood)",     iconPath: "/assets/icons/furs.webp" },
  ivory:       { glyph: "𝕀",  color: "var(--bg)",           iconPath: "/assets/icons/ivory.webp" },
  unicorns:    { glyph: "🦄", color: "var(--res-faith)",    iconPath: "/assets/icons/unicorns.webp" },
  spice:       { glyph: "✲",  color: "var(--accent)",       iconPath: "/assets/icons/spice.webp" },
  blueprint:   { glyph: "📐", color: "var(--res-science)",  iconPath: "/assets/icons/blueprint.webp" },
  // Craft outputs
  beam:        { glyph: "▤",  color: "var(--res-wood)",     iconPath: "/assets/icons/beam.webp" },
  slab:        { glyph: "▦",  color: "var(--res-minerals)", iconPath: "/assets/icons/slab.webp" },
  plate:       { glyph: "▥",  color: "var(--res-iron)",     iconPath: "/assets/icons/plate.webp" },
  scaffold:    { glyph: "⌗",  color: "var(--res-wood)",     iconPath: "/assets/icons/scaffold.webp" },
  steel:       { glyph: "◙",  color: "var(--ink-2)",        iconPath: "/assets/icons/steel.webp" },
  gear:        { glyph: "⚙",  color: "var(--res-iron)",     iconPath: "/assets/icons/gear.webp" },
  alloy:       { glyph: "◐",  color: "var(--cyber)",        iconPath: "/assets/icons/alloy.webp" },
  concrate:    { glyph: "▣",  color: "var(--res-minerals)", iconPath: "/assets/icons/concrete.webp" },
  concrete:    { glyph: "▣",  color: "var(--res-minerals)", iconPath: "/assets/icons/concrete.webp" },
  parchment:   { glyph: "✎",  color: "var(--res-wood)",     iconPath: "/assets/icons/parchment.webp" },
  manuscript:  { glyph: "✑",  color: "var(--res-science)",  iconPath: "/assets/icons/manuscript.webp" },
  compedium:   { glyph: "📖", color: "var(--res-science)",  iconPath: "/assets/icons/compedium.webp" },
  blueprint_craft: { glyph: "📐", color: "var(--res-science)", iconPath: "/assets/icons/blueprint.webp" },
  ship:        { glyph: "⛵", color: "var(--res-wood)",     iconPath: "/assets/icons/ship.webp" },
  tanker:      { glyph: "🚢", color: "var(--ink-2)",        iconPath: "/assets/icons/tanker.webp" },
  thoriumReactor: { glyph: "☢", color: "var(--green)",      iconPath: "/assets/icons/thoriumReactor.webp" },
  kerosene:    { glyph: "🛢", color: "var(--accent)",       iconPath: "/assets/icons/kerosene.webp" },
  megalith:    { glyph: "🗿", color: "var(--res-minerals)", iconPath: "/assets/icons/megalith.webp" },
  eludium:     { glyph: "✦",  color: "var(--cyber)",        iconPath: "/assets/icons/eludium.webp" },
};

export function spriteFor(name: string): ResourceSprite | undefined {
  return RESOURCE_SPRITES[name];
}
