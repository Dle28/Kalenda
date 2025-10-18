# Test Runner Experience

We’ve configured a colorful, professional test setup for the repo:

- Spec reporter in the terminal with colors
- Mochawesome HTML report with charts under `reports/mochawesome/index.html`
- JUnit XML output under `reports/junit/` for CI integration
- Coverage (c8) with HTML and text summary under `reports/coverage/`

## Quick usage

Run the standard tests:

```bash
pnpm test
```

Run with coverage and generate reports:

```bash
pnpm test:cov
```

Open the HTML report in your browser:

- `reports/mochawesome/index.html`
- `reports/coverage/index.html`

CI can pick up `reports/junit/*.xml` for test analytics dashboards.
