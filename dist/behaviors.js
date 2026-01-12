"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBehaviors = loadBehaviors;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function loadBehaviors(behaviorsPath) {
    const absPath = path_1.default.resolve(behaviorsPath);
    const raw = await fs_1.promises.readFile(absPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.behaviors || typeof parsed.behaviors !== "object") {
        throw new Error("Invalid behaviors file: expected behaviors object");
    }
    return parsed.behaviors;
}
