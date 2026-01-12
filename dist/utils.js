"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowIso = nowIso;
exports.createRunId = createRunId;
function nowIso() {
    return new Date().toISOString();
}
function createRunId() {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${stamp}_${rand}`;
}
