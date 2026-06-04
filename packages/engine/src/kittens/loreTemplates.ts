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
    return pick(rng, NATIVE_BIRTH) + ".";
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
];

const YEARLY_JOB_TINTED: Record<string, readonly string[]> = {
  farmer: [
    "brachte die größte Catnip-Ernte des Jahrzehnts ein",
    "rettete das Feld vor einem Mäuse-Vorfall mit nichts als Geduld",
  ],
  woodcutter: [
    "fällte den dicksten Baum am Rande des Forsts",
    "verlor fast eine Pranke an einer hinterhältigen Astgabel — kam mit einer Narbe davon",
  ],
  scholar: [
    "fügte ein dickes Buch der Dorfbibliothek hinzu",
    "verbrachte einen ganzen Sommer mit einer einzigen Gleichung",
  ],
  hunter: [
    "kam mit Fellen für den ganzen Winter zurück",
    "verfehlte das Einhorn um Pfotenbreite — niemand glaubt die Geschichte",
  ],
  miner: [
    "fand eine Ader Eisen, von der das Dorf nichts wusste",
    "wurde verschüttet und mit einem Lachen wieder ausgegraben",
  ],
  geologist: [
    "kartierte einen ganzen Hügel an Mineralien",
    "behauptete, die Steine würden mit den Jahreszeiten singen",
  ],
  priest: [
    "leitete ein Sonnwendfest, an das sich noch alle erinnern",
    "verschwand für eine Woche zur Meditation und brachte eine seltsame Ruhe mit",
  ],
  engineer: [
    "baute eine Maschine, die niemand verstand, die aber half",
    "verbrachte einen Monat damit, eine Tür zu reparieren, die niemand mehr nutzt",
  ],
};

export function generateYearlyEvent(
  kittenId: string,
  year: number,
  job: string | null,
): string {
  const rng = mulberry32(hashString(`yearly:${kittenId}:${year}`));
  // 40% chance to use a job-tinted line if we have one for the kitten's job.
  const jobLines = job ? YEARLY_JOB_TINTED[job] : undefined;
  const useJobLine = jobLines && rng() < 0.4;
  const action = useJobLine ? pick(rng, jobLines) : pick(rng, YEARLY_GENERIC);
  return `Im Jahr ${year} ${action}.`;
}

// ── Helpers for event-text generation (called from action handlers) ──────────

export function describePromote(rankAfter: number): string {
  return `Wurde zu Rang ${rankAfter} befördert.`;
}

export function describeJobChange(jobName: string): string {
  return `Begann als ${jobName} zu arbeiten.`;
}

export function describeLeaderAppointment(): string {
  return "Wurde zur Anführerin des Dorfes ernannt.";
}

export function describeLeaderRemoval(): string {
  return "Trat als Anführerin zurück.";
}

export function describeSpawn(age: number): string {
  if (age <= 0) return "Geboren im Dorf — der Anfang einer langen Geschichte.";
  return `Kam vor ${age} Jahren ins Dorf — wurde ins Dorfleben aufgenommen.`;
}
