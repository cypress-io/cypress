# Webpack-ct

> **Note** this package is not meant to be used outside of cypress component testing.

## Responsibilities

- Make a `webpack.config` from the users setup
    - add current project rules and aliases
    - remove eslint?
- Launch webpack dev server
- Update entry point (in `src/browser.ts`)
- The entry point (`browser.ts`) has to delegate the loading of spec files to the loader + plugin