import type { KittenTrait } from "../village.js";
import { hashString, mulberry32, pick } from "./appearance.js";

// ── Origin stories ────────────────────────────────────────────────────────────

const ORIGIN_PLACES = [
  "aus den tiefen Catnip-Wäldern",
  "von einem fernen Bauernhof",
  "aus den Bergen im Norden",
  "als verwaiste Streunerin im Schnee gefunden",
  "von einer Karawane mitgebracht",
  "aus einer Höhle bei den Klippen",
  "vom Markt der Nachbarstadt",
  "von einer Mühle am Fluss",
  "aus dem alten Steinkreis hinter dem Wald",
];

const ARRIVAL_REASONS = [
  "kam vor {age} Jahren ins Dorf, um Arbeit zu finden",
  "tauchte vor {age} Jahren in einer Schneenacht auf",
  "wurde vor {age} Jahren von einem Jäger heimgebracht",
  "reiste vor {age} Jahren mit einer Karawane Händler an",
  "ist seit {age} Jahren hier — niemand erinnert sich genau warum",
  "wurde vor {age} Jahren als Kätzchen von Älteren adoptiert",
];

const NATIVE_BIRTH = [
  "wurde im Dorf geboren — Eltern unbekannt",
  "wurde im Dorf geboren, ist nie ohne den Geruch von Catnip-Suppe aufgewacht",
  "wurde im Dorf geboren, Geschwister sind über die Felder verstreut",
  "ist ein Dorfkind durch und durch, hat keinen anderen Ort je gesehen",
];

export function generateOrigin(kittenId: string, age: number): string {
  const rng = mulberry32(hashString(`origin:${kittenId}`));
  // Younger kittens are more likely to be native-born; older ones probably arrived.
  const nativeProbability = age < 10 ? 0.55 : age < 20 ? 0.3 : 0.15;
  if (rng() < nativeProbability) {
    return `${pick(rng, NATIVE_BIRTH)}.`;
  }
  const place = pick(rng, ORIGIN_PLACES);
  const reason = pick(rng, ARRIVAL_REASONS).replace("{age}", String(Math.max(1, age)));
  const reasonCap = reason.charAt(0).toUpperCase() + reason.slice(1);
  return `Stammt ${place}. ${reasonCap}.`;
}

// ── Trait flavor (1-line description) ────────────────────────────────────────

const TRAIT_FLAVORS: Record<KittenTrait, readonly string[]> = {
  scientist: [
    "Verbringt ganze Nächte über Pergamenten gebeugt und vergisst dabei das Essen.",
    "Notiert jeden Stern, der zu schnell blinkt.",
    "Spricht mit den Bäumen und behauptet, sie würden antworten.",
  ],
  engineer: [
    "Bastelt aus Holzresten Maschinen, die niemand verlangt hat.",
    "Hat eine eigene Werkbank in der Hütte, mit der niemand sonst auskommt.",
    "Trägt ständig einen Bleistift hinter dem Ohr und eine halbe Idee im Kopf.",
  ],
  merchant: [
    "Riecht einen guten Tausch noch eh die Karawane das Dorf erreicht.",
    "Sammelt fremde Münzen wie andere Kätzchen Federn.",
    "Weiß genau, wer wem was schuldet — vergisst nie.",
  ],
  metallurgist: [
    "Hat Brandnarben auf den Pfoten, trägt sie wie Medaillen.",
    "Hört der Schmelze zu wie andere der Musik.",
    "Kennt die Farben des glühenden Eisens auswendig.",
  ],
  chemist: [
    "Mischt seltsame Tränke und behauptet, es seien Tees.",
    "Riecht oft leicht nach Schwefel und Kräutern.",
    "Hat ein Regal voller Phiolen, deren Inhalt niemand mehr identifizieren kann.",
  ],
  wise: [
    "Spricht selten, aber wenn doch, hört das ganze Dorf zu.",
    "Sitzt am liebsten am Ufer und schaut den Wolken zu.",
    "Erinnert sich an Dinge, die niemand sonst miterlebt hat.",
  ],
  manager: [
    "Schreibt Listen für ihre Listen.",
    "Weiß zu jeder Tageszeit, wer wo sein sollte.",
    "Hält Streitereien in der Hütte unter Kontrolle, mit einem einzigen strengen Blick.",
  ],
  none: [
    "Tut ihren Job und lässt sich nicht stören.",
    "Lebt einfach, mit einem warmen Plätzchen und genug Catnip.",
    "Ein ganz normales Kätzchen — und das ist genau richtig.",
  ],
};

export function generateTraitFlavor(kittenId: string, trait: KittenTrait): string {
  const rng = mulberry32(hashString(`trait:${kittenId}:${trait}`));
  return pick(rng, TRAIT_FLAVORS[trait]);
}

// ── Yearly event snippets ────────────────────────────────────────────────────

const YEARLY_GENERIC = [
  "verbrachte den Frühling damit, Vögel auf der Scheune zu beobachten",
  "verlor während des Winters sein Lieblingskissen",
  "entdeckte eine verborgene Lichtung hinter dem Catnip-Feld",
  "stritt sich mit einer Nachbarin über die richtige Lagerung von Trockenfisch",
  "wachte einmal mit einem Frosch auf der Brust auf und niemand wusste warum",
  "fand einen alten Anhänger im Garten — niemand weiß, wem er gehörte",
  "fing an, jeden Sonnenuntergang vom Hügel aus zu beobachten",
  "lernte ein Lied von einer durchziehenden Karawane und summt es seitdem",
  "kämpfte sich durch einen Sturm, der das Dach zerlegte",
  "half einer Streunerin durch die kalte Jahreszeit",
  "war fast einen ganzen Sommer lang verschwunden — kehrte schmaler aber zufrieden zurück",
  "rettete einen jungen Catnip-Setzling vor dem Schneefall",
  "fand im Herbst eine ungewöhnlich rote Kastanie und hütet sie seitdem",
  "sammelte den ganzen Sommer Federn, ohne jemandem den Grund zu nennen",
  "schlief drei Tage am Stück, nachdem die Kirschblüten gefallen waren",
  "verbrachte eine Nacht im Glockenturm und kam mit Staub im Pelz zurück",
  "fing eine Maus, ließ sie wieder frei und sah ihr lange nach",
  "lernte, wie man Pfifferlinge von giftigen Pilzen unterscheidet",
  "wurde von einer Krähe verfolgt und schwört, sie wieder zu erkennen",
  "fand im Schnee eine Spur, der niemand sonst folgen wollte",
  "verbrannte sich die Pfote am Lagerfeuer und erzählte die Geschichte ein Jahr lang",
  "schenkte einer alten Kätzin den ersten Apfel der Ernte",
  "tanzte zur Mittsommernacht, bis die Sterne verblassten",
  "fand einen Brief in einer Flasche am Bach — die Tinte war verwischt",
  "sprach drei Tage lang nicht, ohne dass jemand wusste warum",
  "lehrte einem jungen Kätzchen, wie man auf den Mehlbaum klettert",
  "begegnete im Nebel einer Gestalt, die niemand sonst gesehen hat",
  "trug einen Stein über das ganze Feld, nur um zu sehen, ob es geht",
  "sah einmal den Mond bei Tag und nahm es als Vorzeichen",
  "verlor im Wettrennen gegen ein Eichhörnchen, mit Würde",
];

const YEARLY_JOB_TINTED: Record<string, readonly string[]> = {
  farmer: [
    "brachte die größte Catnip-Ernte des Jahrzehnts ein",
    "rettete das Feld vor einem Mäuse-Vorfall mit nichts als Geduld",
    "lehrte einem Kätzchen, Saatgut nach Mond zu legen",
    "pflanzte heimlich Sonnenblumen am Rand des Acker — niemand wusste warum",
  ],
  woodcutter: [
    "fällte den dicksten Baum am Rande des Forsts",
    "verlor fast eine Pranke an einer hinterhältigen Astgabel — kam mit einer Narbe davon",
    "fand im Stamm einer alten Eiche einen Vogelschwarm aus Bernstein",
    "ließ ein Beil im Wald liegen und brachte es ein Jahr später als Geschichte zurück",
  ],
  scholar: [
    "fügte ein dickes Buch der Dorfbibliothek hinzu",
    "verbrachte einen ganzen Sommer mit einer einzigen Gleichung",
    "übersetzte einen verschwommenen Text aus den Klippen — niemand wagt, ihn zu lesen",
    "behauptete, ein Komet sei für genau dieses Dorf bestimmt gewesen",
  ],
  hunter: [
    "kam mit Fellen für den ganzen Winter zurück",
    "verfehlte das Einhorn um Pfotenbreite — niemand glaubt die Geschichte",
    "spurte einen Wolf bis zum Fluss und ließ ihn gehen",
    "schenkte den jüngsten Kätzchen die ersten geübten Bögen",
  ],
  miner: [
    "fand eine Ader Eisen, von der das Dorf nichts wusste",
    "wurde verschüttet und mit einem Lachen wieder ausgegraben",
    "hörte Stimmen im Stollen, kehrte aber zurück und sprach nicht darüber",
    "schlug eine glitzernde Stelle ab und gab sie dem ältesten Dorfkätzchen",
  ],
  geologist: [
    "kartierte einen ganzen Hügel an Mineralien",
    "behauptete, die Steine würden mit den Jahreszeiten singen",
    "fand einen Stein, der nach Regen klingt",
    "verbrachte einen Frühling damit, jedem Hügel einen Namen zu geben",
  ],
  priest: [
    "leitete ein Sonnwendfest, an das sich noch alle erinnern",
    "verschwand für eine Woche zur Meditation und brachte eine seltsame Ruhe mit",
    "predigte einer einzigen Katze stundenlang auf dem Hügel",
    "entzündete im Winter Feuer, die das ganze Dorf wärmten",
  ],
  engineer: [
    "baute eine Maschine, die niemand verstand, die aber half",
    "verbrachte einen Monat damit, eine Tür zu reparieren, die niemand mehr nutzt",
    "konstruierte einen Vogelhäuschen-Aufzug aus Holz und Bindfaden",
    "erfand einen Mausefallen-Mechanismus, den die Mäuse weiterhin überlistet haben",
  ],
};

/** Trait-tinted yearly snippets — selected before job-tinted with lower probability. */
const YEARLY_TRAIT_TINTED: Record<string, readonly string[]> = {
  scientist: [
    "verlor sich in den Sternen, bis die Pfoten kalt wurden",
    "schrieb eine Hypothese auf die Hauswand — sie wurde erst im Frühjahr überstrichen",
    "behauptete, eine neue Konstellation entdeckt zu haben, und benannte sie nach Catnip",
  ],
  engineer: [
    "zerlegte eine Sense in dreißig Teile und baute neunundzwanzig wieder zusammen",
    "fand heraus, wie man den Brunnen schneller einkurbelt — alle waren mäßig beeindruckt",
    "erfand ein Werkzeug, dessen Zweck niemand erfragen wollte",
  ],
  merchant: [
    "tauschte ein altes Halsband gegen drei Krüge Met und kam vorne weg",
    "verhandelte das ganze Jahr über Tauschkurse — niemand verstand das System",
    "brachte aus einer fernen Stadt einen Beutel Salz mit, der noch immer reicht",
  ],
  metallurgist: [
    "hörte im Ofen eine Melodie, die nur sie verstand",
    "schmolz einen verbeulten Eimer wieder zu einem brauchbaren Werkzeug",
    "fand eine Glühfarbe, der sie einen eigenen Namen gab",
  ],
  chemist: [
    "mischte etwas in einem Krug, das eine Woche lang summte",
    "rettete die Ziegen mit einem Tee aus Rinde und Honig",
    "verbrannte sich beim Experimentieren die Schnurrhaare — wuchsen schöner nach",
  ],
  wise: [
    "saß einen ganzen Tag am Ufer und kam mit einer Wahrheit zurück",
    "erinnerte sich an einen Winter, den niemand sonst erlebt hatte",
    "sagte einen einzigen Satz beim Festmahl, und alle waren still",
  ],
  manager: [
    "schlichtete einen Streit zwischen den Fischern und den Jägern mit einer Liste",
    "organisierte die Vorratskammer so, dass niemand sie mehr versteht außer ihr selbst",
    "wusste vor dem Sturm, wer wo schlafen sollte",
  ],
  none: [
    "fand ein warmes Plätzchen, das niemand sonst gesehen hatte",
    "verbrachte den ganzen Sommer barfuß und glücklich",
    "wurde einfach ein Jahr älter, ohne Aufhebens",
  ],
};

// ── Romance, vacation, coworker-bond pools (catchall yearly variants) ────────

const ROMANCE_TEMPLATES = [
  "verliebte sich in {partner} — niemand im Dorf war überrascht",
  "und {partner} wurden in jenem Jahr unzertrennlich",
  "verbrachte unzählige Abende mit {partner} am Lagerfeuer",
  "tauschte mit {partner} ein selbstgemachtes Halsband",
  "wachte häufiger neben {partner} auf als allein",
];

const VACATION_WARM = [
  "verbrachte den Sommer am Fluss-Ufer und kam mit sonnengebleichtem Pelz zurück",
  "machte eine lange Wanderung durchs Tal und schwört, einen Wasserfall gefunden zu haben",
  "erkundete im Frühling die Wälder hinter dem Hügel — drei Tage Catnip im Pelz",
  "schlief eine ganze Mittsommer-Woche unter freiem Himmel",
  "zog mit einer Karawane bis zur nächsten Stadt — und kam mit fremden Liedern zurück",
];

const VACATION_COLD = [
  "kuschelte sich durch einen langen Winter, schrieb mehr als sonst",
  "sammelte im Herbst Pilze und Beeren, bis die Kammer voll war",
  "verbrachte die kalte Jahreszeit am Ofen, las alle Bücher der Bibliothek zweimal",
  "lief im ersten Schnee bis zur Klippe und zurück, einfach nur weil",
];

const BOND_TEMPLATES = [
  "war oft mit {partner} ({job}) unterwegs",
  "lernte viel von {partner}, die schon länger als {job} arbeitet",
  "arbeitete Seite an Seite mit {partner} — die Schicht ging immer schneller",
  "teilte das Mittagsbrot mit {partner} im {job}-Schuppen",
  "ließ {partner} bei jeder Mühe nicht hängen, und umgekehrt genauso",
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
  const text = `Im Jahr ${year} ${tmpl.replace("{partner}", fullName(partner))}.`;
  return { text, relatedKittenId: partner.id };
}

export function generateVacation(kittenId: string, year: number, season: string): string {
  const rng = mulberry32(hashString(`vacation:${kittenId}:${year}:${season}`));
  const pool = season === "summer" || season === "spring" ? VACATION_WARM : VACATION_COLD;
  return `Im Jahr ${year} ${pick(rng, pool)}.`;
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
  const text = `Im Jahr ${year} ${tmpl.replace("{partner}", fullName(partner)).replace("{job}", job)}.`;
  return { text, relatedKittenId: partner.id };
}

/**
 * One narrative slice of life for a kitten in a given year. Deterministic via
 * mulberry32 — replays produce identical text for any (kittenId, year).
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
  season = "summer",
  peers: readonly YearlyPeer[] = [],
  sameJobKittens: readonly YearlyPeer[] = [],
  selfAge = 0,
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
    return { text: `Im Jahr ${year} ${pick(rng, traitLines)}.` };
  }
  const jobLines = job ? YEARLY_JOB_TINTED[job] : undefined;
  if (roll < 0.85 && jobLines) {
    return { text: `Im Jahr ${year} ${pick(rng, jobLines)}.` };
  }
  return { text: `Im Jahr ${year} ${pick(rng, YEARLY_GENERIC)}.` };
}

// ── Helpers for event-text generation (called from action handlers) ──────────

export function describePromote(rankAfter: number): string {
  return `Wurde zu Rang ${rankAfter} befördert.`;
}

export function describeJobChange(jobName: string): string {
  return `Begann als ${jobName} zu arbeiten.`;
}

export type JobAssignedReason = "matchedTrait" | "reassigned";

/**
 * Lore line for a new job assignment. "matchedTrait" carries the lore weight:
 * the kitten was chosen *for* this work because of their nature. "reassigned"
 * is the fallback when no trait match was available — still meaningful, but
 * pragmatic rather than vocational.
 */
export function describeJobAssigned(jobName: string, reason: JobAssignedReason): string {
  if (reason === "matchedTrait") {
    return `Wurde zum ${jobName} berufen — ihre Anlagen passten wie das Schloss zum Schlüssel.`;
  }
  return `Wurde dem ${jobName}-Posten zugewiesen.`;
}

export type JobLeftReason = "unassigned" | "quotaCut";

export function describeJobLeft(prevJob: string, reason: JobLeftReason): string {
  if (reason === "quotaCut") {
    return `Wurde vom ${prevJob}-Posten abgezogen — die Quote wurde reduziert.`;
  }
  return `Verließ den ${prevJob}-Posten.`;
}

export function describeLeaderAppointment(): string {
  return "Wurde zur Anführerin des Dorfes ernannt.";
}

export function describeLeaderRemoval(): string {
  return "Trat als Anführerin zurück.";
}

export function describeSpawn(
  age: number,
  parents?: { motherName?: string; fatherName?: string },
): string {
  if (age <= 0) {
    if (parents?.motherName && parents.fatherName) {
      return `Geboren im Dorf als Kind von ${parents.motherName} und ${parents.fatherName} — der Anfang einer langen Geschichte.`;
    }
    if (parents?.motherName) {
      return `Geboren im Dorf, Kind von ${parents.motherName} — der Anfang einer langen Geschichte.`;
    }
    return "Geboren im Dorf — der Anfang einer langen Geschichte.";
  }
  return `Kam vor ${age} Jahren ins Dorf — wurde ins Dorfleben aufgenommen.`;
}

// ── Death & bereavement (Paket F) ────────────────────────────────────────────

const DEATH_TEMPLATES_BY_SEASON: Record<string, readonly string[]> = {
  spring: [
    "Erlag im Frühling der Schwäche — die Knospen waren gerade aufgegangen.",
    "Schloss die Augen, als die ersten Schwalben zurückkamen.",
  ],
  summer: [
    "Verstarb in einem heißen Sommer, als selbst die Schatten dünn wurden.",
    "Ging in einer langen Sommernacht, ohne Klage.",
  ],
  autumn: [
    "Trug das letzte Laub mit sich davon — fiel mit ihm.",
    "Verstarb, als die ersten Nebel über die Felder zogen.",
  ],
  winter: [
    "Verhungerte in einem bitteren Winter — die Vorräte reichten nicht.",
    "Schlief im tiefsten Frost ein und wachte nicht mehr auf.",
  ],
};

const DEATH_TEMPLATES_GENERIC = [
  "Verstarb still — das Dorf bemerkte es erst am Abend.",
  "Wurde am Ende sehr klein und sehr leicht.",
  "Erlag der Hunger-Zeit, mit Würde bis zuletzt.",
];

export function describeDeath(victimAge: number, season: string): string {
  const seasonTemplates = DEATH_TEMPLATES_BY_SEASON[season];
  const candidates = seasonTemplates ?? DEATH_TEMPLATES_GENERIC;
  // Deterministic per (victim age + season) so replays match.
  const rng = mulberry32(hashString(`death:${victimAge}:${season}`));
  const baseLine = pick(rng, candidates);
  if (victimAge >= 30) {
    return `Lebte ${victimAge} Jahre im Dorf. ${baseLine}`;
  }
  return baseLine;
}

const BEREAVEMENT_BY_CONTEXT: Record<string, readonly string[]> = {
  job: [
    "Trauerte um {name}, den Arbeitsplatz neben sich — die Schicht fühlt sich nun leer an.",
    "Verlor mit {name} eine Stimme aus den Werkstunden, die sie schmerzlich vermisst.",
    "Hat {name} bei der Arbeit am letzten Tag noch lachen hören — das Lachen ist verstummt.",
  ],
  leader: [
    "Trauerte um {name}, das Dorf-Oberhaupt — niemand wusste, wer nun den Ton setzt.",
    "Hatte {name} als Führung respektiert; deren Stimme fehlt nun an jeder Versammlung.",
  ],
  general: [
    "Trauerte um {name}, das ihr Nachbar war — die Hütte daneben bleibt nun still.",
    "Verlor {name} aus dem Dorf — und mit ihr ein Lächeln, das sie täglich gegrüßt hatte.",
    "Brachte {name} die letzte Decke noch in der Nacht — am Morgen war sie nicht mehr da.",
    "Hat {name} oft im Catnip-Feld gesehen; nun streift sie dort allein.",
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
    "Wurde Mutter von {child}.",
    "Hielt {child} zum ersten Mal — und wusste, dass sich nun alles ändert.",
    "Schenkte dem Dorf {child} — eine kleine, neue Stimme im Chor der Hütten.",
  ],
  father: [
    "Wurde Vater von {child}.",
    "Hielt {child} zum ersten Mal in den Pfoten und konnte nicht aufhören zu schauen.",
    "Schwor sich, {child} alles beizubringen, was er weiß.",
  ],
};

export function describeParenthood(childName: string, role: "mother" | "father"): string {
  const rng = mulberry32(hashString(`parenthood:${childName}:${role}`));
  return pick(rng, PARENTHOOD_TEMPLATES[role]).replace("{child}", childName);
}

// ── Festival & milestone (Paket H) ───────────────────────────────────────────

const FESTIVAL_TEMPLATES = [
  "Genoss das Sonnwendfest — die Trommeln hallten bis spät in die Nacht.",
  "Tanzte beim Festumzug, bis die Pfoten schmerzten.",
  "Trug zum Fest ihre besten Federn und ein neues Halsband.",
  "Aß beim Festmahl mehr Trockenfisch, als sie zugeben würde.",
  "Stand beim Schluss-Feuerwerk lange still und sagte nichts.",
  "Half mit, die Festtafeln aufzubauen — und blieb dann beim Sternegucken.",
  "Hörte einer fremden Karawane beim Fest singen und summt das Lied seitdem.",
  "Verlor ihr Festabzeichen im Catnip-Feld — fand es im nächsten Frühjahr wieder.",
];

export function describeFestival(kittenId: string, year: number): string {
  const rng = mulberry32(hashString(`festival:${kittenId}:${year}`));
  return pick(rng, FESTIVAL_TEMPLATES);
}

const MILESTONE_BUILDING_TEMPLATES = [
  "Stand dabei, als das erste {building} im Dorf errichtet wurde — sah jeden Balken anlegen.",
  "Half mit, das erste {building} aufzubauen — und ist noch heute stolz darauf.",
  "Schlug den ersten Nagel ins erste {building} — die Pfote tut bei Regen noch weh.",
  "Sah als Erste, wie das erste {building} im Morgenlicht stand — ein neuer Tag im Dorf.",
];

const MILESTONE_RESEARCH_TEMPLATES = [
  "Saß dabei, als das Dorf das Wissen um {research} zum ersten Mal aussprach.",
  "Half mit, {research} zu entdecken — schrieb die ersten Notizen mit.",
  "Erlebte den Tag, an dem das Dorf {research} verstand — alles fühlte sich danach weiter an.",
  "Trug das Wissen um {research} als Erste hinaus aufs Feld.",
];

export function describeMilestoneBuilding(
  kittenId: string,
  year: number,
  buildingName: string,
): string {
  const rng = mulberry32(hashString(`milestone-b:${kittenId}:${year}:${buildingName}`));
  return pick(rng, MILESTONE_BUILDING_TEMPLATES).replace("{building}", buildingName);
}

export function describeMilestoneResearch(
  kittenId: string,
  year: number,
  researchName: string,
): string {
  const rng = mulberry32(hashString(`milestone-r:${kittenId}:${year}:${researchName}`));
  return pick(rng, MILESTONE_RESEARCH_TEMPLATES).replace("{research}", researchName);
}
