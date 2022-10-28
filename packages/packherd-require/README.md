## @packages/packherd-require

Loads modules that have been bundled by `@tooling/packherd`.

**Table of Contents**

- [Summary](#summary)
- [Loading Bundled/Snapshotted Modules with Packherd](#loading-bundledsnapshotted-modules-with-packherd)
- [Transpiling TypeScript Modules on Demand](#transpiling-typescript-modules-on-demand)
  - [Transpile Cache](#transpile-cache)
  - [Sourcemap Support](#sourcemap-support)
  - [Implementation](#implementation)
  - [Import Caveats](#import-caveats)
- [Env Vars](#env-vars)

## Summary

packherd has three main tasks:

1. bundling application files and providing related metadata
2. loading modules that have been bundled previously and are provided via fully instantiated
   module exports or definition functions that return a module export when invoked
3. transpiling TypeScript modules on demand and maintaining a cache of them 

`1.` is provided by `@tooling/packherd`. `2.` and `3.` are provided by this package. While `1.` and `2.`
are very related and work hand in hand, `3.` is unrelated to them and was
just added here since it is another feature required to intercept module loads.

## Loading Bundled/Snapshotted Modules with Packherd

In order to hook into the `require` process and load from a different source instead of the
file system the [packherdRequire][require fn] function needs to be invoked with the desired
configuration. Note that both this hook and the _transpile TypeScript on demand_ feature can
function together without any problem.

The [require opts][require opts] that are passed to this function allow to configure how
packherd resolves and loads the modules that are included via one of the following:

- `moduleExports`: map of fully instantiated module exports that have been obtained either by
`require` ing each module previously or by having them snapshotted into the application
- `moduleDefinitions`: similar to `moduleExports` except that these are functions that need to
be invoked in order to obtain the `module.exports`, thus incurring some overhead

Since packherd cannot know how the modules are keyed inside the maps, you should pass a  `getModuleKey`
function of [this type][GetModuleKey] in order to resolve those keys. 

For example in the case of [v8-snapshot][v8-snapshot] (TODO: Update this link when snapshot module is added) the [getModuleKey
implementation][v8-snapshot module key] (TODO: Update this link when snapshot module is added) implementation relies on a resolver map that is
embedded inside the app's snapshot. Additionally it knows how modules are keyed via the
[modified esbuild][cypress esbuild] bundler it uses.

Once the module key has been resolved (or even if not) packherd tries its best to resolve
and/or load the module from the most efficient source. It attempts to avoid accessing the file
system until no more options remain and only loads it via the Node.js resolution/loader
mechanism when all else failed.

For more details on the module resolve/load steps refer to [PackherdModuleLoader][packherd
module loader], in particular [`tryLoad`][try load] and [`tryResolve`][try resolve] including
the relevant code sections which include detailed comments for each step.


## Transpiling TypeScript Modules on Demand

To enable this feature the [packherdRequire][require fn] has to be invoked in order to
have it hook into Node.js `require` calls via a `Module._extension`. Particularly the
[`transpileOpts`][transpile opts] field of the [opts][require opts] needs to be configured as follows.

- `supportTS`: `true`
- `initTranspileCache`: needs to be a function matching [InitTranspileCache][init transpile cache fn]

### Transpile Cache

We recommend to use the [dirt-simple-file-cache][dirt-simple-file-cache] module to provide the
transpile cache as it has been developed alongside packherd for just this purpose.

Here is an example of how that option field could be setup with this module.

```js
const dirtSimpleFileCache = require('dirt-simple-file-cache')
const initTranspileCache = () => 
  DirtSimpleFileCache.initSync(projectBaseDir, { keepInMemoryCache: true })
```

### Sourcemap Support

In order to show original locations for errors logged to the console, packherd hooks into the
generation of error stack traces and maps locations to TypeScript.

For more information please read the [sourcemap docs][sourcemap docs]

### Implementation

Please find more implementation details regarding transpilation inside
[./src/transpile-ts.ts][transpile-ts].

### Import Caveats

Since esbuild enforces the behaviour of imports being static this caused problems
with tests that relied on being able to patch/`sinon.stub` modules even after they were
imported. 

In general we would recommend doing this _properly_ via a tool like
[proxyquire][proxyquire].

## Env Vars

- `PACKHERD_CODE_FRAMES` if set will include code snippets for error messages that have been
  sourcemapped

[require fn]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/require.ts#L71
[require opts]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/require.ts#L23-L32
[transpile opts]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/types.ts#L187-L195
[init transpile cache fn]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/types.ts#L177-L185
[transpile-ts]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/transpile-ts.ts
[GetModuleKey]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/loader.ts#L35-L45
[packherd module loader]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/loader.ts#L226
[try load]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/loader.ts#L536
[try resolve]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/loader.ts#L458
[sourcemap docs]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/sourcemap-support.ts

[v8-snapshot]:https://github.com/thlorenz/v8-snapshot
[v8-snapshot module key]:https://github.com/thlorenz/v8-snapshot/blob/master/src/loading/snapshot-require.ts#L20
[proxyquire]:https://github.com/thlorenz/proxyquire
[dirt-simple-file-cache]:https://github.com/thlorenz/dirt-simple-file-cache
[cypress esbuild]:https://github.com/cypress-io/esbuild/tree/thlorenz/snap
