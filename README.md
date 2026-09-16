# DOMSift — Semantic DOM & Interactive Content Extractor

DOMSift is a production-quality Chrome extension (Manifest V3) built with React, Vite, TypeScript, and Tailwind CSS. It automatically extracts semantic webpage structure (headings H1-H6, subheadings, paragraphs, links, and hierarchy) and discovers safe interactive elements (collapsible accordions, `<details>` dropdowns, tabs, menus) to capture newly revealed content without manual selector configuration.

---

## Features

- **Semantic Hierarchy Extraction**: Extracts H1–H6 headings, navigation links, and structural sections while preserving logical DOM relationships.
- **Automatic Interactive Discovery**: Safely identifies and expands `<details>`, `aria-expanded="false"`, accordions, and tabs to capture newly revealed content.
- **Safety Engine**: Automatically ignores form submit controls, payment/checkout buttons, delete/destructive actions, login/logout controls, and external navigation links.
- **State Restoration**: Re-collapses expanded dropdowns and restores original page DOM attributes after extraction.
- **Dual Export Formats**: Exports complete extraction results to formatted **JSON** and strictly escaped **XML** files.
- **Interactive Popup UI**: Provides a clean React UI with live extraction statistics, search/filtering, tree preview, and quick copy/download controls.
- **Local-Only Security**: Operates 100% locally within the browser. Zero remote server requests or third-party APIs.

---

## Technology Stack

- **Extension Framework**: Chrome Manifest V3
- **Language**: TypeScript
- **Frontend**: React 18 + Tailwind CSS
- **Build Tool**: Vite
- **Icon Set**: Lucide React
- **Test Framework**: Vitest + JSDOM

---

## Directory Structure

```
DOMSift/
├── manifest.json                  # Extension Manifest V3 configuration
├── vite.config.ts                 # Multi-entry Vite bundler configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS tokens & styling
├── vitest.config.ts               # Vitest runner configuration
├── package.json                   # Dependencies and npm scripts
├── public/                        # Extension icons (16, 48, 128 PNGs)
├── src/
│   ├── types/                     # Shared TypeScript interfaces
│   ├── utils/                     # Deduplication, XML/JSON serializers, URL & filename helpers
│   ├── content/                   # Content script, DOM extraction engine, & interactive discovery
│   ├── background/                # Service worker & Chrome downloads handler
│   └── popup/                     # React UI (Header, Controls, PreviewTree, ExportPanel, Settings)
└── tests/                         # Vitest unit test suite
```

---

## Installation & Setup

Follow these steps to build and install DOMSift into Google Chrome:

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Extension Icons (Optional step if building fresh)

```bash
node scripts/generate-icons.js
```

### 3. Build Extension

```bash
npm run build
```

This compiles the TypeScript code and outputs the Chrome-loadable extension bundle in the `dist/` directory.

### 4. Load Extension into Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left menu.
4. Select the **`dist`** directory inside the `DOMSift` project folder.
5. DOMSift is now installed! Pin the extension icon to your Chrome toolbar for quick access.

---

## Usage

1. Open any webpage in Chrome (e.g., documentation sites, Wikipedia, news articles, or blogs).
2. Click the **DOMSift** icon in your Chrome toolbar.
3. Click **Extract Semantic DOM Structure**.
4. DOMSift will analyze the page, automatically expand safe collapsible accordions and dropdowns, capture newly revealed content, and restore the page.
5. Preview the tree hierarchy or filter content using the search bar.
6. Click **Download JSON** or **Download XML** to export the structured data.

---

## Running Tests

To run the automated Vitest test suite:

```bash
npm test
```

To run tests in watch mode during development:

```bash
npm run test:watch
```

---

## Permissions & Safety

DOMSift uses minimal permissions under Manifest V3:
- `activeTab`: Accesses active webpage DOM when user opens popup.
- `scripting`: Executes content script programmatically on current tab if needed.
- `storage`: Stores local preferences (e.g. max interaction depth).
- `downloads`: Saves JSON and XML export files directly to downloads directory.