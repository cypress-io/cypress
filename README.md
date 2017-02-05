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

#### 0.3.9 - *(02/05/17)*
- bump reporter dep

#### 0.3.8 - *(12/05/16)*
- stop test run when there's a script error

#### 0.3.7 - *(11/29/16)*
- send reporter side of error through the reporter

#### 0.3.6 - *(11/27/16)*
- tweaked bundle error message

#### 0.3.5 - *(11/21/16)*
- handle script errors

#### 0.3.4 - *(10/13/16)*
- re-release to rebuild reporter

#### 0.3.3 - *(10/13/16)*
- bump reporter version

#### 0.3.2 - *(10/04/16)*
- fix flash of reverted state when toggling snapshot pinning off

#### 0.3.1 - *(10/04/16)*
- fix issue with snapshot controls

#### 0.3.0 - *(10/03/16)*
- snapshot pinning

#### 0.2.0 - *(10/02/16)*
- enable resizing the reporter and persisting local app settings

#### 0.1.16 - *(09/26/16)*
- publish with correct (prod) version of reporter

#### 0.1.15 - *(09/23/16)*
- reset action hit box box model styles
- improve snapshot css handling

#### 0.1.14 - *(09/19/16)*
- prevent snapshot from cycling when there's only one

#### 0.1.13 - *(09/13/16)*
- build prod version of reporter

#### 0.1.12 - *(09/13/16)*
- correctly interpolate contentType

#### 0.1.11 - *(09/13/16)*
- fix for null contentType

#### 0.1.10 - *(09/07/16)*
- bump core reporter

#### 0.1.9 - *(09/07/16)*
- nuke iframe contents, added content type, cleanup npm dist

#### 0.1.8 - *(08/31/16)*
- defaultCommandTimeout config + socket events

#### 0.1.7 - *(08/30/16)*
- build prod before publishing

#### 0.1.6 - *(08/30/16)*
- bump reporter

#### 0.1.5 - *(08/30/16)*
- bump node, spec:changed event

#### 0.1.4 - *(08/26/16)*
- minify prod css

#### 0.1.3 - *(08/26/16)*
- get font-awesome from npm instead of bower

#### 0.1.2 - *(08/23/16)*
- change file names: app.js -> runner.js & app.css -> runner.scss

#### 0.1.0 - *(08/23/16)*
- initial release
