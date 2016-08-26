# Cypress Core Runner

![Runner](https://cloud.githubusercontent.com/assets/1157043/17947042/e9352ae2-6a18-11e6-85af-3670c7cfba03.png)

The runner is the minimal "chrome" around the user's app and has the following responsibilities:

- Managing communication between the driver, the reporter, the extension, and the server
- Managing the viewport size and scale
- Showing the currently active URL

## Development

```bash
## Install project dependencies
npm install
```

```bash
## Runs a dev server (localhost:8000 if free, but could be different - check the output in the console)
## Watches all project files
## - runs *.js and *.jsx through babel and bundles with browserify into single runner.js in dist
## - runs associated unit test of file saved and outputs to terminal
## - compiles *.scss files to single runner.css in dist
npm start
```

```bash
## Runs all tests
npm test
```

## Changelog

#### 0.1.4 - *(08/26/16)*
- minify prod css

#### 0.1.3 - *(08/26/16)*
- get font-awesome from npm instead of bower

#### 0.1.2 - *(08/23/16)*
- change file names: app.js -> runner.js & app.css -> runner.scss

#### 0.1.0 - *(08/23/16)*
- initial release
