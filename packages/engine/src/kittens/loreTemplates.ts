import type { KittenTrait } from "../village.js";
import { hashString, mulberry32, pick } from "./appearance.js";

// ── Origin stories ────────────────────────────────────────────────────────────

const ORIGIN_PLACES = [
  "from the deep catnip woods",
  "from a distant farm",
  "from the northern mountains",
  "found as a stray kitten in the snow",
  "brought along by a passing caravan",
  "from a cave near the cliffs",
  "from the market of the neighbouring town",
  "from an old mill by the river",
  "from the old stone circle behind the wood",
];

const ARRIVAL_REASONS = [
  "came to the village {age} years ago looking for work",
  "showed up {age} years ago on a snowy night",
  "was brought home by a hunter {age} years ago",
  "arrived {age} years ago with a caravan of traders",
  "has been here for {age} years and nobody remembers exactly why",
  "was adopted as a kitten {age} years ago by the elders",
];

const NATIVE_BIRTH = [
  "was born in the village, parents unknown",
  "was born in the village and has never woken up without the smell of catnip stew",
  "was born in the village, with siblings scattered across the fields",
  "is a village kitten through and through, has never seen another place",
];

export function generateOrigin(kittenId: string, age: number): string {
  const rng = mulberry32(hashString(`origin:${kittenId}`));
  // Younger kittens are more likely to be native-born; older ones probably arrived.
  const nativeProbability = age < 10 ? 0.55 : age < 20 ? 0.3 : 0.15;
  if (rng() < nativeProbability) {
    return pick(rng, NATIVE_BIRTH) + ".";
  }
  const place = pick(rng, ORIGIN_PLACES);
  const reason = pick(rng, ARRIVAL_REASONS).replace("{age}", String(Math.max(1, age)));
  const reasonCap = reason.charAt(0).toUpperCase() + reason.slice(1);
  return `Hails ${place}. ${reasonCap}.`;
}

// ── Trait flavor (1-line description) ────────────────────────────────────────

const TRAIT_FLAVORS: Record<KittenTrait, readonly string[]> = {
  scientist: [
    "Spends whole nights hunched over parchments, forgetting to eat.",
    "Notes down every star that blinks too fast.",
    "Talks to the trees and swears they answer back.",
  ],
  engineer: [
    "Builds machines from scrap wood that nobody asked for.",
    "Keeps a workbench in the hut that nobody else can use.",
    "Always wears a pencil behind one ear and half an idea in the head.",
  ],
  merchant: [
    "Can smell a good trade before the caravan reaches the village.",
    "Collects foreign coins the way other kittens collect feathers.",
    "Knows exactly who owes whom what, and never forgets.",
  ],
  metallurgist: [
    "Bears burn scars on the paws and wears them like medals.",
    "Listens to the smelt the way others listen to music.",
    "Knows the colours of glowing iron by heart.",
  ],
  chemist: [
    "Mixes strange brews and insists they are teas.",
    "Often smells faintly of sulphur and herbs.",
    "Has a shelf of phials whose contents nobody can identify any more.",
  ],
  wise: [
    "Rarely speaks, but when she does the whole village listens.",
    "Likes to sit by the river bank and watch the clouds.",
    "Remembers things that nobody else witnessed.",
  ],
  manager: [
    "Writes lists for her lists.",
    "Knows at any hour of the day who should be where.",
    "Settles squabbles in the hut with a single stern look.",
  ],
  none: [
    "Does the job and asks not to be bothered.",
    "Lives simply, with a warm spot and enough catnip.",
    "Just an ordinary little kitten, and that is exactly right.",
  ],
};

export function generateTraitFlavor(kittenId: string, trait: KittenTrait): string {
  const rng = mulberry32(hashString(`trait:${kittenId}:${trait}`));
  return pick(rng, TRAIT_FLAVORS[trait]);
}

// ── Yearly event snippets ────────────────────────────────────────────────────

const YEARLY_GENERIC = [
  "spent the spring watching birds on the barn",
  "lost a favourite cushion during the winter",
  "discovered a hidden glade behind the catnip field",
  "argued with a neighbour about the proper way to store dried fish",
  "once woke up with a frog on the chest and nobody knew why",
  "found an old pendant in the garden, owner unknown",
  "began watching every sunset from the hill",
  "learned a song from a passing caravan and has been humming it ever since",
  "fought through a storm that ripped the roof apart",
  "helped a stray make it through the cold season",
  "vanished for almost a whole summer and came back thinner but content",
  "rescued a young catnip seedling from the snowfall",
  "found an unusually red chestnut in autumn and has kept it ever since",
  "collected feathers all summer without telling anyone why",
  "slept three days straight after the cherry blossoms fell",
  "spent a night in the bell tower and came back with dust in the fur",
  "caught a mouse, let it go, and watched it for a long while",
  "learned how to tell chanterelles from poisonous mushrooms",
  "was chased by a crow and swears she would recognise it again",
  "found a trail in the snow that nobody else dared to follow",
  "burned a paw at the campfire and told the story for a whole year",
  "gave an old cat the first apple of the harvest",
  "danced through midsummer night until the stars faded",
  "found a letter in a bottle by the brook, ink all blurred",
  "did not speak for three days and nobody knew why",
  "taught a young kitten how to climb the flour tree",
  "met a figure in the fog that nobody else has ever seen",
  "carried a stone across the whole field just to see if it could be done",
  "once saw the moon in daylight and took it as an omen",
  "lost a footrace against a squirrel, with dignity",
];

const YEARLY_JOB_TINTED: Record<string, readonly string[]> = {
  farmer: [
    "brought in the largest catnip harvest of the decade",
    "saved the field from a mouse incident with nothing but patience",
    "taught a young kitten how to sow seed by the moon",
    "secretly planted sunflowers at the edge of the field, no reason given",
  ],
  woodcutter: [
    "felled the thickest tree at the edge of the forest",
    "nearly lost a paw to a treacherous branch, came away with a scar",
    "found a swarm of amber birds inside the trunk of an old oak",
    "left an axe in the woods and brought it back a year later as a story",
  ],
  scholar: [
    "added a thick book to the village library",
    "spent a whole summer on a single equation",
    "translated a smudged text from the cliffs that nobody dares to read",
    "claimed a comet had been meant for this very village",
  ],
  hunter: [
    "came back with furs enough for the whole winter",
    "missed the unicorn by a paw's breadth, nobody believes the story",
    "tracked a wolf to the river and let it go",
    "gave the youngest kittens their first practice bows",
  ],
  miner: [
    "found a vein of iron the village knew nothing about",
    "was buried in a cave-in and dug out laughing",
    "heard voices in the gallery, came back and never spoke of it",
    "chipped off a glittering piece and gave it to the oldest village kitten",
  ],
  geologist: [
    "mapped a whole hill of minerals",
    "claimed the stones sing with the seasons",
    "found a stone that rings like rain",
    "spent a spring naming every hill",
  ],
  priest: [
    "led a solstice festival that everyone still remembers",
    "vanished for a week of meditation and came back wrapped in calm",
    "preached for hours on the hill to a single cat",
    "lit fires through the winter that warmed the whole village",
  ],
  engineer: [
    "built a machine that nobody understood, but it helped",
    "spent a month repairing a door that nobody uses any more",
    "engineered a birdhouse pulley out of wood and twine",
    "invented a mousetrap mechanism that the mice still outwit",
  ],
};

/** Trait-tinted yearly snippets, selected before job-tinted with lower probability. */
const YEARLY_TRAIT_TINTED: Record<string, readonly string[]> = {
  scientist: [
    "lost herself in the stars until her paws went cold",
    "wrote a hypothesis on the side of the house, it was painted over in spring",
    "claimed to have found a new constellation and named it Catnip",
  ],
  engineer: [
    "took a scythe apart into thirty pieces and put twenty-nine back together",
    "figured out how to crank the well faster, everyone was mildly impressed",
    "invented a tool whose purpose nobody dared to ask about",
  ],
  merchant: [
    "traded an old collar for three jugs of mead and came out ahead",
    "ran exchange rates all year, nobody understood the system",
    "brought back a sack of salt from a distant town that still has not run out",
  ],
  metallurgist: [
    "heard a melody in the furnace that only she could understand",
    "remelted a dented bucket back into a useful tool",
    "found a glow colour she gave her own name to",
  ],
  chemist: [
    "mixed something in a jug that hummed for a week",
    "saved the goats with a tea of bark and honey",
    "burned her whiskers experimenting, they grew back even nicer",
  ],
  wise: [
    "sat by the river bank a whole day and came back with a truth",
    "remembered a winter that nobody else had lived through",
    "said a single sentence at the feast and everyone fell silent",
  ],
  manager: [
    "settled a dispute between fishers and hunters with a list",
    "organised the pantry so nobody but her can find anything any more",
    "knew before the storm who should sleep where",
  ],
  none: [
    "found a warm spot that nobody else had noticed",
    "spent the whole summer barefoot and happy",
    "simply turned a year older without any fuss",
  ],
};

// ── Romance, vacation, coworker-bond pools (catchall yearly variants) ────────

const ROMANCE_TEMPLATES = [
  "fell for {partner}, much to nobody's surprise",
  "and {partner} became inseparable that year",
  "spent countless evenings with {partner} by the campfire",
  "exchanged a hand-made collar with {partner}",
  "woke up beside {partner} more often than alone",
];

const VACATION_WARM = [
  "spent the summer by the river bank and came back with sun-bleached fur",
  "took a long walk through the valley and swears to have found a waterfall",
  "explored the woods behind the hill in spring, three days of catnip in the fur",
  "slept a whole midsummer week under the open sky",
  "travelled with a caravan to the next town and came back with foreign songs",
];

const VACATION_COLD = [
  "curled up through a long winter and wrote more than usual",
  "gathered mushrooms and berries in autumn until the pantry was full",
  "spent the cold season by the stove and read every book in the library twice",
  "ran out into the first snow as far as the cliff and back, just because",
];

const BOND_TEMPLATES = [
  "spent many days with {partner} the {job}",
  "learned a lot from {partner}, who has worked as a {job} far longer",
  "worked side by side with {partner}, the shift always went faster",
  "shared the noon bread with {partner} in the {job} shed",
  "never let {partner} down at a hard task, and the other way around",
];

/** Minimal peer-shape for Romance/Bond selection. Engine passes Kitten[]. */
export interface YearlyPeer {
  readonly id: string;
  readonly name: string;
  readonly surname: string;
  readonly age: number;
}

function fullName(p: YearlyPeer): string {
  return `${p.name} ${p.surname}`.trim();
}

export function generateRomance(
  selfId: string,
  selfAge: number,
  year: number,
  peers: readonly YearlyPeer[],
): { text: string; relatedKittenId: string } | null {
  const candidates = peers.filter((p) => p.id !== selfId && Math.abs(p.age - selfAge) <= 8);
  if (candidates.length === 0) return null;
  const rng = mulberry32(hashString(`romance:${selfId}:${year}`));
  const partner = candidates[Math.floor(rng() * candidates.length)]!;
  const tmpl = pick(rng, ROMANCE_TEMPLATES);
  const text = `In year ${year}, ${tmpl.replace("{partner}", fullName(partner))}.`;
  return { text, relatedKittenId: partner.id };
}

export function generateVacation(kittenId: string, year: number, season: string): string {
  const rng = mulberry32(hashString(`vacation:${kittenId}:${year}:${season}`));
  const pool = season === "summer" || season === "spring" ? VACATION_WARM : VACATION_COLD;
  return `In year ${year}, ${pick(rng, pool)}.`;
}

export function generateCoworkerBond(
  selfId: string,
  year: number,
  job: string,
  sameJobKittens: readonly YearlyPeer[],
): { text: string; relatedKittenId: string } | null {
  if (sameJobKittens.length === 0) return null;
  const rng = mulberry32(hashString(`bond:${selfId}:${year}:${job}`));
  const partner = sameJobKittens[Math.floor(rng() * sameJobKittens.length)]!;
  const tmpl = pick(rng, BOND_TEMPLATES);
  const text =
    `In year ${year}, ` +
    tmpl.replace("{partner}", fullName(partner)).replace("{job}", job) +
    ".";
  return { text, relatedKittenId: partner.id };
}

/**
 * One narrative slice of life for a kitten in a given year. Deterministic via
 * mulberry32 so replays produce identical text for any (kittenId, year).
 *
 * The router picks a category based on a single roll, then falls through to
 * the next available pool if the chosen category has no candidates (e.g.
 * Romance with zero peers, Bond without coworkers). Final fallback is the
 * generic pool, so this always returns something.
 *
 * Probabilities (when all pools available):
 *   15% Romance · 10% Vacation · 20% Coworker-Bond · 20% Trait · 20% Job · 15% Generic
 */
export function generateYearlyEvent(
  kittenId: string,
  year: number,
  job: string | null,
  trait: KittenTrait | null = null,
  season: string = "summer",
  peers: readonly YearlyPeer[] = [],
  sameJobKittens: readonly YearlyPeer[] = [],
  selfAge: number = 0,
): { text: string; relatedKittenId?: string } {
  const rng = mulberry32(hashString(`yearly:${kittenId}:${year}`));
  const roll = rng();

  if (roll < 0.15) {
    const r = generateRomance(kittenId, selfAge, year, peers);
    if (r) return r;
  }
  if (roll < 0.25) {
    return { text: generateVacation(kittenId, year, season) };
  }
  if (roll < 0.45 && job && sameJobKittens.length > 0) {
    const b = generateCoworkerBond(kittenId, year, job, sameJobKittens);
    if (b) return b;
  }
  const traitLines = trait && trait !== "none" ? YEARLY_TRAIT_TINTED[trait] : undefined;
  if (roll < 0.65 && traitLines) {
    return { text: `In year ${year}, ${pick(rng, traitLines)}.` };
  }
  const jobLines = job ? YEARLY_JOB_TINTED[job] : undefined;
  if (roll < 0.85 && jobLines) {
    return { text: `In year ${year}, ${pick(rng, jobLines)}.` };
  }
  return { text: `In year ${year}, ${pick(rng, YEARLY_GENERIC)}.` };
}

// ── Helpers for event-text generation (called from action handlers) ──────────

export function describePromote(rankAfter: number): string {
  return `Was promoted to rank ${rankAfter}.`;
}

export function describeJobChange(jobName: string): string {
  return `Began working as a ${jobName}.`;
}

export type JobAssignedReason = "matchedTrait" | "reassigned";

/**
 * Lore line for a new job assignment. "matchedTrait" carries the lore weight:
 * the kitten was chosen *for* this work because of their nature. "reassigned"
 * is the fallback when no trait match was available. Still meaningful, but
 * pragmatic rather than vocational.
 */
export function describeJobAssigned(jobName: string, reason: JobAssignedReason): string {
  if (reason === "matchedTrait") {
    return `Was called to be a ${jobName}. Her talents fit the work like a key fits a lock.`;
  }
  return `Was assigned to the ${jobName} post.`;
}

export type JobLeftReason = "unassigned" | "quotaCut";

export function describeJobLeft(prevJob: string, reason: JobLeftReason): string {
  if (reason === "quotaCut") {
    return `Was pulled from the ${prevJob} post. The quota had been cut.`;
  }
  return `Left the ${prevJob} post.`;
}

export function describeLeaderAppointment(): string {
  return "Was named leader of the village.";
}

export function describeLeaderRemoval(): string {
  return "Stepped down as leader.";
}

export function describeSpawn(
  age: number,
  parents?: { motherName?: string; fatherName?: string },
): string {
  if (age <= 0) {
    if (parents?.motherName && parents.fatherName) {
      return `Born in the village to ${parents.motherName} and ${parents.fatherName}. The start of a long story.`;
    }
    if (parents?.motherName) {
      return `Born in the village, child of ${parents.motherName}. The start of a long story.`;
    }
    return "Born in the village. The start of a long story.";
  }
  return `Came to the village ${age} years ago and was taken into village life.`;
}

// ── Death & bereavement (Paket F) ────────────────────────────────────────────

const DEATH_TEMPLATES_BY_SEASON: Record<string, readonly string[]> = {
  spring: [
    "Slipped away in spring, just as the buds had opened.",
    "Closed her eyes as the first swallows returned.",
  ],
  summer: [
    "Passed in a hot summer, when even the shadows had thinned.",
    "Went on a long summer night, without complaint.",
  ],
  autumn: [
    "Carried the last leaves away and fell with them.",
    "Passed as the first mists drifted across the fields.",
  ],
  winter: [
    "Starved in a bitter winter. The stores had not been enough.",
    "Fell asleep in the deepest frost and did not wake again.",
  ],
};

const DEATH_TEMPLATES_GENERIC = [
  "Passed quietly. The village only noticed by evening.",
  "Became very small and very light in the end.",
  "Succumbed to the hunger season, with dignity to the last.",
];

export function describeDeath(victimAge: number, season: string): string {
  const seasonTemplates = DEATH_TEMPLATES_BY_SEASON[season];
  const candidates = seasonTemplates ?? DEATH_TEMPLATES_GENERIC;
  // Deterministic per (victim age + season) so replays match.
  const rng = mulberry32(hashString(`death:${victimAge}:${season}`));
  const baseLine = pick(rng, candidates);
  if (victimAge >= 30) {
    return `Lived ${victimAge} years in the village. ${baseLine}`;
  }
  return baseLine;
}

const BEREAVEMENT_BY_CONTEXT: Record<string, readonly string[]> = {
  job: [
    "Grieved for {name}, the workmate at her side. The shift feels empty now.",
    "Lost a voice from the work hours with {name}, and misses it sorely.",
    "Heard {name} laugh on the very last day of work. The laughter has fallen silent.",
  ],
  leader: [
    "Grieved for {name}, the village head. Nobody knew who would set the tone now.",
    "Had respected {name} as a leader. Her voice is now missing at every gathering.",
  ],
  general: [
    "Grieved for {name}, who had been a neighbour. The hut next door stays quiet now.",
    "Lost {name} from the village, and with her a smile that had greeted her daily.",
    "Brought {name} a last blanket in the night. By morning she was gone.",
    "Had often seen {name} in the catnip field. Now she walks there alone.",
  ],
};

export type BereavementContext = "job" | "leader" | "general";

export function describeBereavement(victimName: string, context: BereavementContext): string {
  const pool = BEREAVEMENT_BY_CONTEXT[context] ?? BEREAVEMENT_BY_CONTEXT.general!;
  // Deterministic per (victim name + context) so the same death generates the
  // same bereavement line in each survivor's log on replay.
  const rng = mulberry32(hashString(`bereavement:${victimName}:${context}`));
  return pick(rng, pool).replace("{name}", victimName);
}

// ── Parenthood (Paket G) ─────────────────────────────────────────────────────

const PARENTHOOD_TEMPLATES: Record<"mother" | "father", readonly string[]> = {
  mother: [
    "Became mother to {child}.",
    "Held {child} for the first time and knew everything would change now.",
    "Gave the village {child}, a small new voice in the chorus of huts.",
  ],
  father: [
    "Became father to {child}.",
    "Held {child} in his paws for the first time and could not stop looking.",
    "Swore to teach {child} everything he knows.",
  ],
};

export function describeParenthood(childName: string, role: "mother" | "father"): string {
  const rng = mulberry32(hashString(`parenthood:${childName}:${role}`));
  return pick(rng, PARENTHOOD_TEMPLATES[role]).replace("{child}", childName);
}

// ── Festival & milestone (Paket H) ───────────────────────────────────────────

const FESTIVAL_TEMPLATES = [
  "Enjoyed the solstice festival. The drums echoed late into the night.",
  "Danced in the parade until her paws ached.",
  "Wore her best feathers and a new collar to the feast.",
  "Ate more dried fish at the feast than she would admit to.",
  "Stood quietly through the closing fireworks and said nothing.",
  "Helped set up the festival tables, then stayed for the stargazing.",
  "Heard a passing caravan sing at the festival and has been humming the tune since.",
  "Lost her festival pin in the catnip field, and found it again the next spring.",
];

export function describeFestival(kittenId: string, year: number): string {
  const rng = mulberry32(hashString(`festival:${kittenId}:${year}`));
  return pick(rng, FESTIVAL_TEMPLATES);
}

const MILESTONE_BUILDING_TEMPLATES = [
  "Stood there as the first {building} was raised in the village and watched every beam go up.",
  "Helped raise the first {building}, and is still proud of it today.",
  "Drove the first nail into the first {building}. The paw still aches in the rain.",
  "Was first to see the first {building} stand in the morning light. A new day in the village.",
];

const MILESTONE_RESEARCH_TEMPLATES = [
  "Sat in as the village first spoke the knowledge of {research} aloud.",
  "Helped discover {research}, and wrote down the first notes.",
  "Witnessed the day the village understood {research}. Everything felt wider after that.",
  "Was first to carry the knowledge of {research} out into the fields.",
];

export function describeMilestoneBuilding(kittenId: string, year: number, buildingName: string): string {
  const rng = mulberry32(hashString(`milestone-b:${kittenId}:${year}:${buildingName}`));
  return pick(rng, MILESTONE_BUILDING_TEMPLATES).replace("{building}", buildingName);
}

export function describeMilestoneResearch(kittenId: string, year: number, researchName: string): string {
  const rng = mulberry32(hashString(`milestone-r:${kittenId}:${year}:${researchName}`));
  return pick(rng, MILESTONE_RESEARCH_TEMPLATES).replace("{research}", researchName);
}
