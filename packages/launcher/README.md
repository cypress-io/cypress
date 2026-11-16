# Launcher

This package finds and launches browsers for each operating system.

## Developing

The TypeScript source files are in the [`lib`](/lib) folder.

To see the browsers detected on your machine, run the following from the `packages/launcher` directory. The `@packages/ts` require hook transpiles the TypeScript on the fly:

```bash
node -r @packages/ts/register -e "require('./lib/detect').detect().then(console.log, console.error)"
```

You can also check whether a specific binary is recognized as a browser by passing its path:

```bash
node -r @packages/ts/register -e "require('./lib/detect').detectByPath(process.argv[1]).then(console.log, console.error)" /usr/bin/chromium-browser
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
