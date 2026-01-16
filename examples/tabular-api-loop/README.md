# tabular-api-loop

Example that combines:

- API loop calls to JSONPlaceholder using `inputs.items`.
- Tabular viewer for a local CSV.

## How to run

```
npm start -- --plan examples/tabular-api-loop/plan.json --out runs
```

## Notes

- Requires network access to reach jsonplaceholder.typicode.com.
- The tabular step generates `viewer.html` and `screenshot.png`.
