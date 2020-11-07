# DaData.ru Suggestions plugin

===

JavaScript plugin for [DaData.ru Suggestions](https://dadata.ru/suggestions/) service.

### Installation

`npm install @dadata/suggestions`

### Basic Usage

```
import { init } from '@dadata/suggestion';

// ...

const disposeSuggestions = init(document.getElementById(...), { type: 'address' });

// ...

disposeSuggestions();
```
