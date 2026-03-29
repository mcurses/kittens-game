// AchievementsPanel — display earned achievements and badges
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";

interface AchievementEntry {
  name: string;
  unlocked: boolean;
  starUnlocked: boolean;
}

interface BadgeEntry {
  name: string;
  unlocked: boolean;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

function extractAchievements(state: GameStateResponse): {
  achievements: AchievementEntry[];
  badges: BadgeEntry[];
  badgesUnlocked: boolean;
} {
  const raw = state as unknown as Record<string, unknown>;
  const ach = raw.achievements as Record<string, unknown> | null | undefined;
  if (!ach) return { achievements: [], badges: [], badgesUnlocked: false };

  const achievements: AchievementEntry[] = Array.isArray(ach.achievements)
    ? (ach.achievements as AchievementEntry[]).filter((a) => a.unlocked)
    : [];

  const badges: BadgeEntry[] = Array.isArray(ach.badges)
    ? (ach.badges as BadgeEntry[]).filter((b) => b.unlocked)
    : [];

  return {
    achievements,
    badges,
    badgesUnlocked: ach.badgesUnlocked === true,
  };
}

export function AchievementsPanel({ state }: Props): React.ReactElement {
  if (!state) {
    return <div data-testid="achievements-panel-loading">Loading achievements...</div>;
  }

  const { achievements, badges } = extractAchievements(state);

  return (
    <div data-testid="achievements-panel">
      <h2>Achievements</h2>

      {achievements.length === 0 ? (
        <p>No achievements unlocked yet.</p>
      ) : (
        <ul>
          {achievements.map((a) => (
            <li key={a.name} data-testid={`achievement-${a.name}`}>
              {a.starUnlocked ? "★ " : ""}
              {a.name}
            </li>
          ))}
        </ul>
      )}

      {badges.length > 0 && (
        <section>
          <h3>Badges ({badges.length})</h3>
          <ul>
            {badges.map((b) => (
              <li key={b.name} data-testid={`badge-${b.name}`}>
                {b.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
