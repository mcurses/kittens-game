import fs from "fs";
import LZString from "lz-string";

const compressed = fs.readFileSync(
  "../../agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt",
  "utf8",
);
const json = LZString.decompressFromBase64(compressed);
const data = JSON.parse(json);

// Get all buildings with non-zero val
const buildings = Object.entries(data.buildings)
  .filter(([_, b]) => b?.val > 0)
  .map(([idx, b]) => [Number.parseInt(idx), b.val, b.on ?? 0]);

console.log("Buildings with val > 0:");
console.log("Index | Val | On");
buildings.forEach(([idx, val, on]) => {
  console.log(
    `${idx.toString().padStart(3)} | ${val.toString().padStart(4)} | ${on.toString().padStart(2)}`,
  );
});
