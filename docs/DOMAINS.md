# Domains

This document describes domain boundaries and responsibilities.

## core
- Orchestrates plans, context resolution, exports, and run summaries.
- Owns runner, plan validation, and cross-cutting utilities.

## domains
- `api`: Executes HTTP requests based on curl assets and produces evidence.
- `sql`: Executes SQL evidence steps (SQLite/MySQL) and produces evidence.
- `browser`: Runs Playwright behaviors and captures screenshots.
- `cli`: Executes local commands and captures stdout/stderr.
- `specialist`: Handles small, recurring tasks that are not CLI or API.
- `logstream`: Registers external logstream links as evidence artifacts.
- `tabular`: Generates CSV/XLSX viewer HTML and captures screenshots.

## subdomains (guideline)
- Prefer new subfolders under a domain for specialized variants.
- Keep step config minimal and document behavior in `HOWTO.md`.
