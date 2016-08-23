# Cypress Core Reporter

## Installation

```bash
npm install @cypress/core-reporter --save
```

## Usage

```javascript
import Reporter from 'reporter'

<Reporter
  runner={/* event emitter */}
  specPath={/* path to spec file */}
/>
```

## Development

```bash
## Install project dependencies
npm install
```

```bash
## Watches all project files
## - runs *.js and *.jsx through babel and outputs individually to dist
## - runs associated unit test of file saved and outputs to terminal
## - compiles *.scss files to single reporter.css in dist
npm start
```

```bash
## Runs all tests
npm test
```


## Changelog

#### 0.1.0 - *(08/23/16)*
- initial release
