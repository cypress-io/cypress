# Cypress Core Launcher

> Finds and launches browsers on each platform

## Install

Root install is preferred (see `CONTRIBUTING.md`), but if you must

* `npm install`
* `npm run build`

## Development

The TypeScript source files are in `lib` folder.

## Debugging

Uses [debug](https://github.com/visionmedia/debug#readme)
to output debug log messages. To turn on, use

```sh
DEBUG=cypress:launcher npm test
```

## Demo

To see browsers detected on your machine, just run `node index.js`
