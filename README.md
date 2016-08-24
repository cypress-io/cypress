# Cypress Core Reporter

![Reporter](https://cloud.githubusercontent.com/assets/1157043/17947006/bffba412-6a18-11e6-86ee-af7e9c9d614e.png)

The reporter shows the running results of the tests. It includes the following:

- A button to focus the list of test files
- Stats for number of tests passed, failed, and pending
- The total test run duration
- Control for toggling auto-scrolling
- Controls for various states (running, paused, stopped, etc.)
- A command log, showing:
  * suites
  * tests
  * hooks
  * commands and assertions with detailed information
  * any failures/errors
- Toggle-able auto-scrolling of command log

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
