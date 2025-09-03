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
│   ├── src/
│   │   ├── index.js
│   │   └── index.d.ts
│   ├── lib/
│   │   ├── electron.js
│   │   ├── install.js
│   │   ├── paths.js
│   │   └── ... (other compiled files)
│   └── ... (other compiled files)
├── esm/           # ES Module build
│   ├── src/
│   │   ├── index.js
│   │   │   └── index.d.ts
│   ├── lib/
│   │   ├── electron.js
│   │   ├── install.js
│   │   ├── paths.js
│   │   └── ... (other compiled files)
│   └── ... (other compiled files)
└── Cypress/       # Electron app binary (created by --install)
    ├── Cypress.app/
    ├── version
    └── ... (other app files)
```

## Package Entry Points

- **CommonJS**: `dist/cjs/src/index.js` (via `main` field)
- **TypeScript**: `dist/cjs/src/index.d.ts` (via `types` field)
- **Binary**: `bin/cypress-electron` (via `bin` field)

## Usage

### CommonJS (Primary)
```javascript
const { installIfNeeded } = require('@packages/electron')
```

### Binary Interface
```bash
# Install/build Electron binary
./bin/cypress-electron --install

# Show help
./bin/cypress-electron --help

# Open an app
./bin/cypress-electron /path/to/your/app
```

### ES Modules (Alternative)
```javascript
import { installIfNeeded } from '@packages/electron'
```

## Configuration Files

- `tsconfig.base.json` - Base TypeScript configuration
- `tsconfig.cjs.json` - CommonJS build configuration
- `tsconfig.esm.json` - ES Module build configuration
- `tsconfig.json` - Main configuration (extends base)

