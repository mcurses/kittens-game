// Decorative job sprites overlaid on the village hero image.
// Each job gets a glyph + color. spritePosition() returns a deterministic
// percentage-based coordinate inside the 16:9 hero box, so the layout is
// stable across renders for a given job name + index.

export interface JobSprite {
  glyph: string;
  color: string;
  iconPath?: string;
}

export const JOB_SPRITES: Record<string, JobSprite> = {
  woodcutter: { glyph: "🪓", color: "var(--res-wood)", iconPath: "/assets/icons/woodcutter.webp" },
  farmer: { glyph: "🌾", color: "var(--res-catnip)", iconPath: "/assets/icons/farmer.webp" },
  scholar: { glyph: "📚", color: "var(--res-science)", iconPath: "/assets/icons/scholar.webp" },
  hunter: { glyph: "🏹", color: "var(--accent)", iconPath: "/assets/icons/hunter.webp" },
  miner: { glyph: "⛏", color: "var(--res-minerals)", iconPath: "/assets/icons/miner.webp" },
  geologist: { glyph: "🪨", color: "var(--res-iron)", iconPath: "/assets/icons/geologist.webp" },
  priest: { glyph: "✦", color: "var(--res-faith)", iconPath: "/assets/icons/priest.webp" },
  engineer: { glyph: "⚙", color: "var(--cyber)", iconPath: "/assets/icons/engineer.webp" },
};

// 32-bit FNV-1a, used as a deterministic seed source.
function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Deterministic sprite position as `{x, y}` percentages inside the hero box.
// `x` and `y` stay inside [10, 90] so glyphs don't kiss the edges.
export function spritePosition(jobName: string, index: number): { x: number; y: number } {
  const h1 = hash32(`${jobName}-${index}-x`);
  const h2 = hash32(`${jobName}-${index}-y`);
  return {
    x: 10 + (h1 % 80),
    y: 10 + (h2 % 80),
  };
}
