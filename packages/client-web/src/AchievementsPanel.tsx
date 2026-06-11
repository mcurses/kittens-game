// AchievementsPanel — display earned achievements and badges with flavor + icon
import type { GameStateResponse } from "@kittens/api-spec";
import type React from "react";
import { PlaceholderImage } from "./PlaceholderImage.js";
import { ACHIEVEMENT_FLAVOR, BADGE_FLAVOR, prettifyName } from "./flavorText.js";

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

  return { achievements, badges, badgesUnlocked: ach.badgesUnlocked === true };
}

export function AchievementsPanel({ state }: Props): React.ReactElement {
  if (!state) {
    return (
      <div className="loading-text" data-testid="achievements-panel-loading">
        Loading…
      </div>
    );
  }

  const { achievements, badges } = extractAchievements(state);

  return (
    <div data-testid="achievements-panel">
      <div className="panel-label">Achievements</div>
      {achievements.length === 0 ? (
        <p className="panel-empty">No achievements unlocked yet.</p>
      ) : (
        <ul className="item-list">
          {achievements.map((a) => (
            <li
              key={a.name}
              data-testid={`achievement-${a.name}`}
              className="item-row achievement-row"
            >
              <PlaceholderImage
                variant="character"
                alt={a.name}
                className="achievement-row__icon"
              />
              <div className="achievement-row__content">
                <div className="achievement-row__title">
                  {a.starUnlocked && <span className="achievement-star">★</span>}
                  <span className="item-row-name">{prettifyName(a.name)}</span>
                </div>
                {ACHIEVEMENT_FLAVOR[a.name] && (
                  <p className="achievement-row__description">{ACHIEVEMENT_FLAVOR[a.name]}</p>
                )}
              </div>
              {a.starUnlocked && <span className="done-badge">★ Star</span>}
            </li>
          ))}
        </ul>
      )}

      {badges.length > 0 && (
        <div className="panel-subsection">
          <div className="panel-sublabel">Badges ({badges.length})</div>
          <ul className="item-list">
            {badges.map((b) => (
              <li key={b.name} data-testid={`badge-${b.name}`} className="item-row achievement-row">
                <PlaceholderImage
                  variant="character"
                  alt={b.name}
                  className="achievement-row__icon"
                />
                <div className="achievement-row__content">
                  <span className="item-row-name">{prettifyName(b.name)}</span>
                  {BADGE_FLAVOR[b.name] && (
                    <p className="achievement-row__description">{BADGE_FLAVOR[b.name]}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
