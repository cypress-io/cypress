## Transpiling TypeScript during Development

While developing TypeScript is transpiled _on the fly_ via the _packherd_ tool which uses
_esbuild_ to transform the transpilation. _packherd_ hooks into Node.js's `require` in order to
archieve this.

This step is implemented inside `./hook-require.js` defined in this package. This is achieved
via a call to `require('@packages/ts/register')` from any other package. The hook is only
applied the first time this `require` call executes.

Transpiled files are stored inside a temporary file cache in order to
save time on subsequent startups.
For _on the fly_ transpilation sourcemaps are inlined into the JS artifact.

## Transpiling TypeScript for Production

Since the Cypress CI task already check types via `tsc`, all that we do here is transpile all
TypeScript files with _esbuild_ with a similar config as when transpiling in development.

The major difference is that we don't inline sourcemaps, but place them inside a `.map` file
right next to the JavaScript artifact.

A build and clean script to do that are provided inside `../../scripts/tooling/build-prod/`.
They leverage functions provided in this `packages/ts` defined inside `./build-ts.js`.

Those scripts are then leveraged via the a appropriate `yarn` tasks for example:

```json
"scripts": {
  "build-prod": "tooling_build-typescript",
  "clean": "tooling_clean-typescript"
}
```

Below is a summary of how all Cypress packages fit into the _transpile TypeScript_ pipeline
when building for production.

## Analysis of Packages WRT TypeScript Transpilation

### Packages without `build-prod` task

- **https-proxy**
- **reporter**
- **root** (dummy package pointing at root package)
- **ts**
- **ui-components**
- **webconfig**

### Packages with `build-prod` task

#### Packages not Transpiling TypeScript
 
- **desktop-gui** `cross-env NODE_ENV=production yarn build` produces `./dist`
- **electron** `yarn build` produces `./dist`
- **example** `yarn build` produces `./app` and `./cypress`
- **extension** `yarn build` produces `./app` and `./dist`
- **runner** `cross-env NODE_ENV=production yarn build` runs webpack to produce `./dist`
- **static** `yarn build` produces `./dist`

#### Packages Transpiling TypeScript

All packages are now transpiled the same way using _esbuild_ with the same config. As mentioned
above the JS artifact is placed next to the TypeScript file as before and a `.map` file is
placed right next to it in order to support sourcemaps in production.

##### How these packages were built before we switched to _esbuild_

- **launcher** `tsc --project .` transpiles 11 TypeScript files placing JS files inline
- **net-stubbing** `tsc --project .` transpiles 13 TypeScript files placing JS files inline
- **network** `tsc --project .` transpiles 9 TypeScript files placing JS files inline
- **proxy** `tsc --project .` transpiles 14 TypeScript files placing JS files inline
- **rewriter** `tsc --project .` transpiles  11 TypeScript files placing JS files inline
- **runner-ct** `cross-env NODE_ENV=production yarn build && tsc` runs webpack to produce `./dist`
  and transpiles 2 TypeScript files placing JS files inline as well as `.map` files
  (`"sourceMap": true,` inside its `tsconfig.json`)
- **server** `tsc` transpiles 45 TypeScript files placing JS files inline
- **server-ct** `tsc` transpiles 6 TypeScript files placing JS files inline
- **socket** `tsc` transpiles 3 TypeScript files placing JS files inline

Difference between `tsc` and `tsc --project .` is which `tsconfig.json` is used.

When building with `esbuild` which doesn't support most tsconfig options those don't matter and
we can treat them the same.
