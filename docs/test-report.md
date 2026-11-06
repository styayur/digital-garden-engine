# Test Report

**Date:** 2026-11-06
**Primary local environment:** Windows 11, Node.js 22.23.4, npm 10.9.9, Rust 1.98.1, Chromium 158, 7-Zip 9.10 beta

This report records commands that were actually run for the v0.5.0 implementation. CI results must be added after the release branch is pushed.

## Local results

| Area | Command / evidence | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | PASS |
| Legacy publication gate | `node --test tests/*.test.mjs` | PASS: 2 tests |
| Schema, editor, HTML, autosave, publication, 7z | `npm run test:unit` | PASS: 15 tests |
| Root static website | `npm run build:example` | PASS |
| Internal links, root build | `npm run check:links` | PASS: 450 links |
| Artifact audit, root build | `npm run artifact:audit` | PASS: 1,029 files |
| GitHub Pages subpath build | `npm run build:pages` | PASS |
| Internal links, Pages build | subpath link check in build | PASS: 448 links |
| Artifact audit, Pages build | subpath build audit | PASS: 1,029 files |
| Standalone project website | `npm run build:project` | PASS |
| Real browser workflows | `npm run test:e2e` | PASS: 4 Playwright tests when run after the final build sequence |
| Desktop filesystem tests | `npm run desktop:test` | PASS: 2 Rust tests |
| Windows installer | `npm run desktop:build` | PASS: `Rhizomaybor_0.5.0_x64-setup.exe`, 8.80 MiB |
| Project 7z extraction | independent 7-Zip extraction | PASS: 4 files |
| Website 7z extraction | independent 7-Zip extraction | PASS: 18 files / deployable static tree |

## Playwright coverage

1. MarkText-compatible Muya editor mounts for Markdown and source/preview modes remain available.
2. Autosave persists changes and the recovery banner restores them after reload.
3. Complete browser workflow:
   - edit a title;
   - edit arbitrary HTML in source mode;
   - change a section layout;
   - add and drag a component;
   - undo and redo;
   - switch to mobile preview;
   - save project JSON;
   - export project 7z;
   - extract with independent 7-Zip;
   - import the archive back into the editor;
   - rebuild a standalone site from the extracted project;
   - open that rebuilt site in a browser;
   - export and independently extract the publishable website archive.
4. GitHub Pages `/rhizomaybor/` subpath build serves the garden and editor with correctly prefixed scripts.

## Archive verification

The test suite asserts the 7z signature:

```text
37 7A BC AF 27 1C
```

The release sample archives were extracted with an independently installed 7-Zip executable. Every path in each manifest inventory was checked after extraction.

## Known gaps

- CI results remain pending until the branch is pushed.
- GitHub Pages deployment requires the repository Pages environment to be enabled for Actions.
- The Windows installer is unsigned because no code-signing certificate is available in this environment.
- The standalone website generator deliberately does not execute MDX components.
