"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plan_1 = require("./core/plan");
const runner_1 = require("./core/runner");
function readArg(flag) {
    const idx = process.argv.indexOf(flag);
    if (idx === -1) {
        return undefined;
    }
    return process.argv[idx + 1];
}
async function main() {
    const planPath = readArg("--plan") ?? readArg("-p");
    const outDir = readArg("--out") ?? readArg("-o") ?? "runs";
    if (!planPath) {
        console.error("Missing --plan <path>");
        process.exit(2);
        return;
    }
    const plan = await (0, plan_1.loadPlan)(planPath);
    await (0, runner_1.executePlan)(plan, outDir);
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
