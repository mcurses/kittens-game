import { runLiveImportParityAudit } from "./liveParity.js";

function printSection(_title: string, mismatches: string[]): void {
  if (mismatches.length === 0) {
    return;
  }
  for (const _mismatch of mismatches) {
  }
}

const ticksArg = process.argv.find((arg) => arg.startsWith("--ticks="));
const ticks = ticksArg ? Number.parseInt(ticksArg.split("=")[1] ?? "10", 10) : 10;

if (!Number.isFinite(ticks) || ticks < 0) {
  console.error(`Invalid --ticks value: ${String(ticksArg)}`);
  process.exit(2);
}

const result = runLiveImportParityAudit(ticks);
printSection("Run 8 import snapshot parity", result.importMismatches);
printSection(`Run 8 live parity after ${result.ticks} ticks`, result.liveMismatches);

const mismatchCount = result.importMismatches.length + result.liveMismatches.length;
if (mismatchCount > 0) {
  process.exit(1);
}
