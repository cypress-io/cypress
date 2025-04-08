# Launcher

This package finds and launches browsers for each operating system.

## Developing

The TypeScript source files are in [`lib`](/lib) folder.

To see browsers detected on your machine, just run:

```bash
node index.js
```

You can supply a list of binaries to test if they're browsers or not. Try running:

```bash
node index.js /bin/bash /usr/bin/chromium-browser
```

## Testing

```bash
yarn workspace @packages/launcher test
```

## Debugging

Uses [debug](https://github.com/debug-js/debug#readme)
to output debug log messages. To turn on, use

```sh
DEBUG=cypress:launcher:* yarn workspace @packages/launcher test
```

Verbose messages, including detailed stdout, are available under `cypress-verbose:launcher:*`.
