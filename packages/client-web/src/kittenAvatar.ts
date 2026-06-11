// Resolve the avatar path for a kitten with a 3-step fallback hierarchy:
//   1. unique per-kitten portrait if generated (`/assets/characters/k{id}.webp`)
//   2. job-generic portrait if assigned (`/assets/characters/job-{job}.webp`)
//   3. idle generic portrait (`/assets/characters/idle.webp`)

export interface AvatarResolverInput {
  readonly portraitPath?: string | null;
  readonly job: string | null;
}

export function kittenAvatarPath(kitten: AvatarResolverInput): string {
  if (kitten.portraitPath) return kitten.portraitPath;
  if (kitten.job) return `/assets/characters/job-${kitten.job}.webp`;
  return "/assets/characters/idle.webp";
}
