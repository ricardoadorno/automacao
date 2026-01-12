"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPlan = loadPlan;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function loadPlan(planPath) {
    const absPath = path_1.default.resolve(planPath);
    const raw = await fs_1.promises.readFile(absPath, "utf-8");
    if (!planPath.toLowerCase().endsWith(".json")) {
        throw new Error("Only .json plan files are supported in the bootstrap");
    }
    const plan = JSON.parse(raw);
    if (!plan.metadata || !plan.steps || !Array.isArray(plan.steps)) {
        throw new Error("Invalid plan: expected metadata and steps[]");
    }
    return plan;
}
