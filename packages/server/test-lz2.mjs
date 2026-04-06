import LZString from 'lz-string';
import fs from 'fs';

const compressed = fs.readFileSync('../../agent-docs/example-saves/Kittens Game - Run 8 - Year 10527 - Autumn, day 48.txt', 'utf8');
const json = LZString.decompressFromBase64(compressed);
const data = JSON.parse(json);
console.log('Kittens array length:', data.village.kittens?.length ?? 'no array');
console.log('');
console.log('Village object keys:', Object.keys(data.village));
console.log('');
console.log('Village maxKittens:', data.village.maxKittens);
console.log('Village happiness:', data.village.happiness);
console.log('');
console.log('Buildings object keys:', Object.keys(data.buildings).slice(0, 20));
console.log('');
console.log('Sample buildings:');
for (const [name, building] of Object.entries(data.buildings).slice(0, 10)) {
  if (building?.val > 0) {
    console.log(`  ${name}: ${building.val}`);
  }
}
