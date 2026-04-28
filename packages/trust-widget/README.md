# @ote/widget

[![npm](https://img.shields.io/npm/v/@ote/widget)](https://www.npmjs.com/package/@ote/widget)
[![License: AGPLv3+Commercial](https://img.shields.io/badge/License-AGPLv3%20%2B%20Commercial-blue.svg)](LICENSE)

Drop-in trust badge widget for any website. One `<script>` tag and a `<div>` — no build step, no framework dependency.

## CDN install

```html
<script src="https://cdn.opentrustengine.com/widget.min.js" defer></script>

<div data-ote-widget
     data-entity-type="company"
     data-entity-id="b1f2e3d4-..."
     data-theme="light"
     data-size="md"></div>
```

## npm install (for bundlers)

```bash
npm install @ote/widget
```

```ts
import { mount } from '@ote/widget';

mount(document.querySelector('#trust-badge')!, {
  entityType: 'company',
  entityId: 'b1f2…',
  theme: 'dark',
  size: 'lg',
  onLoad: (profile) => console.log(profile.score, profile.band),
});
```

## Themes

`light` (default), `dark`, `glass`, `compact`.

## Sizes

`sm` (24px), `md` (40px), `lg` (64px), `xl` (96px).

## Bands & colors

| Band | Tier      | Colour     |
|------|-----------|------------|
| AAA  | Elite     | `#0a8a4f`  |
| AAB  | Premier   | `#10a965`  |
| ABB  | Trusted   | `#22c97a`  |
| BBB  | Reliable  | `#3aa755`  |
| BBC  | Building  | `#f0b400`  |
| BCC  | Growing   | `#f59000`  |
| CCC  | Starting  | `#e5664f`  |
| DDD  | New       | `#9aa0a6`  |

## License

AGPL-3.0-or-later (or commercial) © Deepak Kumar Dwivedi, Freaquer
