# Cypress Icons

The latest versions of the icons.
The public API will always reference these files.

`./dist` is not checked into source control.

## API

```js
icons = require("@cypress/icons")

// get the absolute path to default favicon
icons.getPathToFavicon("favicon-blue.ico")
// => /Users/.../dist/favicon/favicon-blue.ico

// get the absolute path to icon
icons.getPathToIcon("icon_32x32@2x.png")
// => /Users/.../dist/icons/icon_32x32@2x.png
```

## Architecture detail

To build the MacOS icons you have to use the `iconutil` command line tool installed.
This command line tool is only installed on MacOS.

If you are not on MacOS, the building of this icon will simply be skipped.
Good news the macos is only needed to develop on MacOS.

## Developing

All icons are in the assets directory

```bash
## run build to dump to ./dist
npm run build
```

## Testing

```bash
npm test
```
