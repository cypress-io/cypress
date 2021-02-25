# @cypress/design-system

A design system for the surfaces of testing softwares. 🐛💅

## Values

### It is discreet

Let the surfaces fade away to allow work to happen.

### It is native

Let the surfaces be familiar to where work happens.

### It is accessible

Let the surfaces honor accepted standards so everyone can use them.

### It is specialized

Let the surfaces be appropriate for the job to be done. Favor consistency over novelty, but not at the cost of functionality.

## Usage
The components work with or without the global stylesheet import. The stylesheet import is used to setup global scss tokens, colors, utility classes, and typography.

Component Usage:

```jsx
import { Button } from '@cypress/design-system'
```

To setup global CSS tokens and mixins, you can import the library's `index.scss`. You can either do this with `@use` or `@import` (See CSS Trick's intro to Sass modules [here](https://css-tricks.com/introducing-sass-modules/#import-files-with-use))

SCSS usage:

```scss
// scoped within the *.scss file
@use '@cypress/design-system/src/index.scss' as *;

// import variables and mixins throughout the whole project
// or @import('@cypress/design-system/src/index.scss');

.my-component {
  text-color: $accent-color-01;
}
```

## Development
We are currently using:
* CSS Modules for styling
* TSX for components
* SCSS with module support
* Rollup to bundle
* Cypress CT as a development environment
* Webpack is required for Cypress CT but will soon be replaced by a rollup dev server

#### Developing locally

`yarn cy:open`

#### Building the library

`yarn build`

#### Deploying

TODO: Add netlify site support and static app wrapper

#### Testing

`yarn cy:run`

## TODO
1. Deploy a static page demo-ing the design system
2. Import the first component inside of RunnerCT
3. Hook up tests to circle
4. Publish the package on npm (switch `package.json`'s `publishConfig` to 'public' instead of 'restricted' and then merge into master)
