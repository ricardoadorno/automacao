"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCloudwatchStep = executeCloudwatchStep;
const path_1 = __importDefault(require("path"));
const playwright_1 = require("playwright");
const actions_1 = require("./actions");
async function executeCloudwatchStep(step, actions, stepDir) {
    const retries = step.config?.retries ?? 0;
    const retryDelayMs = step.config?.retryDelayMs ?? 1000;
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const browser = await playwright_1.chromium.launch();
        const page = await browser.newPage();
        try {
            await (0, actions_1.runActions)(page, actions);
            const screenshotPath = path_1.default.join(stepDir, "screenshot.png");
            await page.screenshot({ path: screenshotPath, fullPage: true });
            await browser.close();
            return { screenshotPath, attempts: attempt + 1 };
        }
        catch (error) {
            lastError = error;
            await browser.close();
            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            }
        }
    }
    throw lastError ?? new Error("cloudwatch step failed");
}
