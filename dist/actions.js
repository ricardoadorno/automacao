"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runActions = runActions;
async function runActions(page, actions) {
    for (const action of actions) {
        await runAction(page, action);
    }
}
async function runAction(page, action) {
    switch (action.type) {
        case "goto":
            await page.goto(action.url, { waitUntil: "load" });
            return;
        case "click":
            await page.click(action.selector);
            return;
        case "fill":
            await page.fill(action.selector, action.text);
            return;
        case "waitForSelector":
            await page.waitForSelector(action.selector, { state: action.state });
            return;
        case "waitForTimeout":
            await page.waitForTimeout(action.ms);
            return;
        default: {
            const _exhaustive = action;
            throw new Error(`Unsupported action: ${JSON.stringify(_exhaustive)}`);
        }
    }
}
