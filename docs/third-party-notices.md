# Third-Party Notices

Rhizomaybor itself is licensed under MPL-2.0. The following dependencies retain their own licenses.

## MarkText / Muya

- Package: `@muyajs/core`
- License: MIT
- Source: https://github.com/marktext/marktext
- Use: MarkText-compatible visual Markdown editing engine

## 7-Zip WASM

- Package: `7z-wasm`
- Bundled runtime: 7-Zip 24.09
- License: see the 7-Zip and unRAR notices distributed with the runtime
- Source: https://github.com/use-strict/7z-wasm
- Runtime copies: `public/vendor/7z/License.txt`, `public/vendor/7z/unRarLicense.txt`

The browser loads the local UMD/WASM runtime. It does not download an executable at runtime.

## DOMPurify

- License: Apache-2.0 or MPL-2.0, as declared by the package
- Use: browser-side HTML sanitization

## sanitize-html

- License: MIT
- Use: Node-side HTML sanitization

## Tauri

- License: Apache-2.0 or MIT
- Use: desktop shell and local filesystem bridge

## Next.js and React

- Next.js and React retain their respective package licenses
- Use: online editor, existing garden website and static build

## Playwright and Vitest

- Apache-2.0 / MIT as declared by the packages
- Use: automated browser and unit tests only

Package lockfiles are the authoritative inventory for transitive dependencies. Release packaging must preserve the applicable license texts and notices.
