# Launcher

This package finds and launches browsers for each operating system.

## Installing

The launcher's dependencies can be installed with:

```bash
cd packages/launcher
npm install
```

## Developing

The TypeScript source files are in [`lib`](/lib) folder.

To see browsers detected on your machine, just run: 

```bash
node index.js
```

## Testing

```bash
npm run test
```

## Debugging

Uses [debug](https://github.com/visionmedia/debug#readme)
to output debug log messages. To turn on, use

```sh
DEBUG=cypress:launcher npm test
```

