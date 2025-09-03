# Electron Package Build Setup

This package is configured to build both CommonJS and ES Module versions using TypeScript compiler (tsc) only.

## Build Commands

```bash
# Build both CJS and ESM versions
npm run build

# Build only CommonJS
npm run build:cjs

# Build only ES Modules  
npm run build:esm

# Clean build output
npm run clean
```

## Output Structure

After building, the `dist/` directory contains:

```
dist/
├── cjs/           # CommonJS build
│   ├── index.js
│   ├── index.d.ts
│   └── ... (other compiled files)
└── esm/           # ES Module build
    ├── index.js
    ├── index.d.ts
    └── ... (other compiled files)
```

## Package Entry Points

- **CommonJS**: `dist/cjs/index.js` (via `main` field)
- **ES Modules**: `dist/esm/index.js` (via `module` field)
- **TypeScript**: `dist/cjs/index.d.ts` (via `types` field)

## Usage

### CommonJS
```javascript
const { installIfNeeded } = require('@packages/electron')
```

### ES Modules
```javascript
import { installIfNeeded } from '@packages/electron'
```

## Configuration Files

- `tsconfig.base.json` - Base TypeScript configuration
- `tsconfig.cjs.json` - CommonJS build configuration
- `tsconfig.esm.json` - ES Module build configuration
- `tsconfig.json` - Main configuration (extends base)

