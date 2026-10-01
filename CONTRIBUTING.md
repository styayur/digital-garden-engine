# Contributing

Thank you for improving the Digital Garden Engine.

## Before opening a pull request

1. Use fictional example content. Never include private notes, credentials or personal data.
2. Keep changes small and explain the publication-boundary impact.
3. Run:

```bash
npm ci
npm run typecheck
npm test
npm run build:example
```

## Publication boundary

Changes to content validation, staging, static export, admin exclusion or artifact auditing need tests. The canary fixtures must remain fictional and must never be weakened.

## Pull requests

Describe the problem, the change and the commands you ran. Include screenshots for visible changes. Security reports belong in GitHub private vulnerability reporting, not a public pull request.
