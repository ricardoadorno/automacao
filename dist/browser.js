"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeBrowserStep = executeBrowserStep;
const path_1 = __importDefault(require("path"));
const playwright_1 = require("playwright");
const actions_1 = require("./actions");
async function executeBrowserStep(actions, stepDir) {
    const browser = await playwright_1.chromium.launch();
    const page = await browser.newPage();
    try {
        await (0, actions_1.runActions)(page, actions);
        const screenshotPath = path_1.default.join(stepDir, "screenshot.png");
        await page.screenshot({ path: screenshotPath, fullPage: true });
        return { screenshotPath };
    }
    finally {
        await browser.close();
    }
}
