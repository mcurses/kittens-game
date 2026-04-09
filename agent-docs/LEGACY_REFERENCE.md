# Legacy Reference Guide

Read this when porting a system. Legacy codebase lives in `legacy/` (~46k lines, Dojo/jQuery/ES5). Do not touch it.

| System | Legacy Files | Key Classes |
|--------|-------------|-------------|
| Game loop | `legacy/game.js:1891` | `Timer`, `GamePage.update()` |
| Effect system | `legacy/core.js` | `IGameAware`, `updateEffectCached()` |
| Resources | `legacy/js/resources.js` | `ResourceManager` |
| Buildings | `legacy/js/buildings.js` | `BuildingsManager`, `getBuildingExt()` |
| Jobs | `legacy/js/village.js` | `VillageManager.getJob()` |
| Science | `legacy/js/science.js` | `ScienceManager` |
| Workshop | `legacy/js/workshop.js` | `WorkshopManager` |
| Religion | `legacy/js/religion.js` | `ReligionManager` |
| Prestige | `legacy/js/prestige.js` | `PrestigeManager` |
| Challenges | `legacy/js/challenges.js` | `ChallengesManager`, LDR logic |
| Space | `legacy/js/space.js` | `SpaceManager` |
| Diplomacy | `legacy/js/diplomacy.js` | `DiplomacyManager` |
| Calendar | `legacy/js/calendar.js` | `Calendar`, `seasons` |
| Time | `legacy/js/time.js` | `TimeManager`, queue system |
| Achievements | `legacy/js/achievements.js` | `Achievements` |
| Save format | `legacy/test/res/save.js` | Top-level save keys |

The existing test suite in `legacy/test/` is a gold mine for expected behavior — read it before writing new tests.
