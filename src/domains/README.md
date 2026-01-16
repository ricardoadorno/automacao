# domains

Each subfolder implements one step type. Keep responsibilities narrow and document new step configs in HOWTO.

## Boundaries
- `api`: HTTP via curl assets only.
- `sql`: SQL execution + evidence generation.
- `browser`: Playwright actions + capture.
- `cli`: Local command execution only (avoid external integrations here).
- `specialist`: Small recurring utilities.
- `logstream`: External logstream links captured as evidence.
- `tabular`: CSV/XLSX viewer generation + evidence capture.
