"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTemplate = resolveTemplate;
exports.resolveTemplatesDeep = resolveTemplatesDeep;
function resolveTemplate(input, context) {
    return input.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => {
        if (context[key] === undefined) {
            throw new Error(`Missing context value for ${key}`);
        }
        return context[key];
    });
}
function resolveTemplatesDeep(input, context) {
    if (typeof input === "string") {
        return resolveTemplate(input, context);
    }
    if (Array.isArray(input)) {
        return input.map((item) => resolveTemplatesDeep(item, context));
    }
    if (input && typeof input === "object") {
        const out = {};
        for (const [key, value] of Object.entries(input)) {
            out[key] = resolveTemplatesDeep(value, context);
        }
        return out;
    }
    return input;
}
