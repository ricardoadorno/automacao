"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOpenApi = loadOpenApi;
exports.hasOperationId = hasOperationId;
exports.hasPathMethod = hasPathMethod;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function loadOpenApi(openapiPath) {
    const abs = path_1.default.resolve(openapiPath);
    const raw = await fs_1.promises.readFile(abs, "utf-8");
    return JSON.parse(raw);
}
function hasOperationId(spec, operationId) {
    if (!spec.paths) {
        return false;
    }
    for (const pathItem of Object.values(spec.paths)) {
        for (const operation of Object.values(pathItem)) {
            if (operation && typeof operation === "object" && operation.operationId === operationId) {
                return true;
            }
        }
    }
    return false;
}
function hasPathMethod(spec, pathKey, method) {
    if (!spec.paths) {
        return false;
    }
    const normalizedMethod = method.toLowerCase();
    const pathItem = spec.paths[pathKey];
    if (!pathItem || typeof pathItem !== "object") {
        return false;
    }
    return Boolean(pathItem[normalizedMethod]);
}
