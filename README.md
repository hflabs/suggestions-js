[![Build Status](https://travis-ci.org/hflabs/suggestions-js.png?branch=main)](https://travis-ci.org/hflabs/suggestions-js)
![GitHub all releases](https://img.shields.io/github/downloads/hflabs/suggestions-js/total)
![npm](https://img.shields.io/npm/dw/hflabs/suggestions)

# DaData.ru Suggestions plugin

===

JavaScript plugin for [DaData.ru Suggestions](https://dadata.ru/suggestions/) service.

### Installation

`npm install @dadata/suggestions`

### Basic Usage

```typescript
import { init, dispose } from '@dadata/suggestion';

// ...
// when you need to initialize Suggestions on some input

const addressInput: HTMLInputElement = document.getElementById(...);
const disposeSuggestions = init(addressInput, { type: 'address' });

// ...
// if you need to remove the Suggestions from the input
// use callback returned from `init()`

disposeSuggestions();

// or just
dispose(addressInput);

```

### Files in this package

- lib/findById.js -- basic search without ui
- lib/findById.ie.js -- same, but built with polyfills
- lib/suggest.js (default) -- search with auto-complete ui
- lib/suggest.ie.js -- same, but built with polyfills
