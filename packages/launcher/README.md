# Launcher

This package finds and launches browsers for each operating system.

## Install

The launcher's dependencies can be installed with:

```bash
cd packages/launcher
npm install
```

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

## Testing

```bash
npm run test
```
