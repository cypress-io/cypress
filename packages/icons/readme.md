# Cypress Icons

The latest versions of the icons are distributed on npm as `./dist`.

The public API will always reference these files.

`./dist` is not checked into source control.

## Installing

```bash
npm install @cypress/icons
```

## API

```coffeescript
icons = require("@cypress/icons")

## get the absolute path to default favicon
icons.getPathToFavicon( *filename* )
icons.getPathToFavicon("favicon-blue.ico")
## => /Users/.../dist/favicon/favicon-blue.ico

## get the absolute path to tray icon
icons.getPathToTray( *filename* )
icons.getPathToTray("mac-normal-red.png")
## => /Users/.../dist/tray/mac-normal-red.png

## get the absolute path to icon
icons.getPathToIcon( *filename* )
icons.getPathToIcon("icon_32x32@2x.png")
## => /Users/.../dist/icons/icon_32x32@2x.png
```

## Linking while Developing

```bash
cd cypress-icons
npm link
cd ../path/to/your/project
npm link cypress-icons
```

## Developing

```bash
## modify files in ./src
<hack hack hack>

## run build to dump to ./dist
npm run build

## commit src
git commit -am 'updated icons'

## publish new version
npm run release
```

## Testing

```bash
npm test
```

## Changelog

#### 0.7.0 - *(05/29/18)*
- add inverse logos
- ignore src and test for npm module

#### 0.6.0 - *(09/20/17)*
- added cypress.ico icons for windows
- remove coffeescript dep

#### 0.5.4 - *(05/29/17)*
- rename package

#### 0.5.3 - *(05/29/17)*
- remove coffee-script, use es6

#### 0.5.2 - *(04/20/17)*
- bump cypress-coffee-script and releaser dep

#### 0.5.1 - *(04/20/17)*
- renamed package, use cypress-coffee-script

#### 0.5.0
- added inverse logo

#### 0.4.1
- fix failing iconset build

#### 0.4.0
- added new method to get path to logo

#### 0.3.2
- added logo folder with black cypress logo

#### 0.3.1
- updated node version to 5.10.0
- bump dep

#### 0.3.0
- added new icon sizes: 48@2x, 48, 38, 19

#### 0.2.1
- updated red and blue tray icons to be darker shade
- updated red and blue favicons to be darker shade

#### 0.2.0
- scoped package to cypress org
- updated favicon api to take path argument

#### 0.1.0
- initial release with updated icons
