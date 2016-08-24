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
## Watch all project files and build as necessary
## Runs a dev server (generally localhost:8000, but could be different - check the output in the console)
npm start
```


## Changelog

#### 0.1.2 - *(08/23/16)*
- change file names: app.js -> runner.js & app.css -> runner.scss

#### 0.1.0 - *(08/23/16)*
- initial release
