import fs from "fs";
import LZString from "lz-string";

const compressed = fs.readFileSync(
  "../../agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt",
  "utf8",
);
const json = LZString.decompressFromBase64(compressed);
const data = JSON.parse(json);

console.log("Legacy save data:");
console.log("  Year:", data.calendar.year);
console.log("  Season:", data.calendar.season);
console.log("  Day:", data.calendar.day);
console.log("  Kittens alive:", data.village.kittens.length);
console.log("  Max Kittens:", data.village.maxKittens);
console.log("");
console.log("Housing buildings (legacy indices):");
console.log("  hut (idx 4):", data.buildings["4"]?.val ?? 0);
console.log("  logHouse (idx 5):", data.buildings["5"]?.val ?? 0);
console.log("  mansion (idx 6):", data.buildings["6"]?.val ?? 0);
console.log("");
console.log("Expected housing capacity:");
const hut = data.buildings["4"]?.val ?? 0;
const logHouse = data.buildings["5"]?.val ?? 0;
const mansion = data.buildings["6"]?.val ?? 0;
const expected = hut * 2 + logHouse * 1 + mansion * 1;
console.log(
  "  hut * 2 + logHouse + mansion = " +
    hut +
    " * 2 + " +
    logHouse +
    " + " +
    mansion +
    " = " +
    expected,
);
console.log("");
console.log("Space buildings (need to find indices):");
// Look for space buildings
const spaceNames = [
  "spaceStation",
  "terraformingStation",
  "outerSpaceStation",
  "lunaSurface",
  "lunaOutpost",
];
for (const name of spaceNames) {
  for (const [idx, building] of Object.entries(data.buildings)) {
    if (building?.val > 0 && idx > 40) {
      // Skip early buildings
      console.log(`  [idx ${idx}]: val=${building.val}`);
    }
  }
  break; // Stop after first check
}

console.log("");
console.log("Total buildings > 0:");
let totalBuildings = 0;
for (const [idx, building] of Object.entries(data.buildings)) {
  if (building?.val > 0) totalBuildings++;
}
console.log("  Count:", totalBuildings);
