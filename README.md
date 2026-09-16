# Meesho Review Explorer

A React + Vite Chrome extension that opens a review analytics modal on Meesho shop pages.

## Features

- Auto-detects the shop handle from `meesho.com/<supplierHandle>`
- Reads the shop profile API to get the masked supplier id
- Fetches reviews in cursor pages of 150
- Search, sort, product filter, rating filter, image-only filter, and date range filter
- Shows loaded date range and filtered result date range
- Shows top 5 reviewed products with average rating and 5/4/3/2/1 breakdown
- Copy or download filtered reviews as JSON

## Development

```bash
npm install
npm run build:extension
```

Load the `extension/` folder in Chrome:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked
4. Select the `extension/` folder

After source changes, run:

```bash
npm run build:extension
```

Then click the extension reload icon in `chrome://extensions` and refresh the Meesho page.

## Project Structure

```text
src/extension/
  components/       React UI components
  hooks/            Stateful review explorer logic
  services/         Axios API service layer
  styles/           SCSS styling
  utils/            Review, storage, and shop helpers
extension/
  manifest.json     Chrome extension manifest
  content.js        Built React content script
  styles.css        Built stylesheet
  injected.js       Page fetch/XHR hook
  page-hook.js      Script injector
```
