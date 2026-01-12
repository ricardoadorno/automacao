"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSwaggerStep = executeSwaggerStep;
const path_1 = __importDefault(require("path"));
const playwright_1 = require("playwright");
const actions_1 = require("./actions");
const openapi_1 = require("./openapi");
async function executeSwaggerStep(step, actions, openapi, stepDir) {
    if (!openapi) {
        throw new Error("openapiPath is required for swagger steps");
    }
    const config = step.config ?? {};
    if (config.operationId) {
        if (!(0, openapi_1.hasOperationId)(openapi, config.operationId)) {
            throw new Error(`operationId not found: ${config.operationId}`);
        }
    }
    else if (config.path && config.method) {
        if (!(0, openapi_1.hasPathMethod)(openapi, config.path, config.method)) {
            throw new Error(`path+method not found: ${config.method} ${config.path}`);
        }
    }
    else {
        throw new Error("swagger step requires operationId or path+method");
    }
    const browser = await playwright_1.chromium.launch();
    const page = await browser.newPage();
    try {
        await (0, actions_1.runActions)(page, actions);
        const screenshotPath = path_1.default.join(stepDir, "screenshot.png");
        await page.screenshot({ path: screenshotPath, fullPage: true });
        let responseText;
        if (config.responseSelector) {
            responseText = await page.textContent(config.responseSelector) ?? "";
        }
        return { screenshotPath, responseText };
    }
    finally {
        await browser.close();
    }
}
