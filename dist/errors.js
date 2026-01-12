"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeErrorFile = writeErrorFile;
exports.writeErrorPng = writeErrorPng;
const fs_1 = require("fs");
const PNG_1X1_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAA" +
    "AAC0lEQVR42mP8/x8AAwMCAO7+uZkAAAAASUVORK5CYII=";
async function writeErrorFile(errorPath, error) {
    const payload = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
    };
    await fs_1.promises.writeFile(errorPath, JSON.stringify(payload, null, 2), "utf-8");
}
async function writeErrorPng(pngPath) {
    const buffer = Buffer.from(PNG_1X1_BASE64, "base64");
    await fs_1.promises.writeFile(pngPath, buffer);
}
