# packherd [![](https://github.com/thlorenz/packherd/workflows/Node/badge.svg?branch=master)](https://github.com/thlorenz/packherd/actions)

Herds all dependencies reachable from an entry and packs them.

[API Documentation](https://thlorenz.github.io/packherd/docs/index.html)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Summary](#summary)
- [Creating a Bundle with Packherd](#creating-a-bundle-with-packherd)
- [Loading Bundled/Snapshotted Modules with Packherd](#loading-bundledsnapshotted-modules-with-packherd)
- [Transpiling TypeScript Modules on Demand](#transpiling-typescript-modules-on-demand)
  - [Transpile Cache](#transpile-cache)
  - [Sourcemap Support](#sourcemap-support)
  - [Implementation](#implementation)
  - [Import Caveats](#import-caveats)
- [Env Vars](#env-vars)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Summary

packherd has three main tasks:

1. bundling application files and providing related metadata
2. loading modules that have been bundled previously and are provided via fully instantiated
   module exports or definition functions that return a module export when invoked
3. transpiling TypeScript modules on demand and maintaining a cache of them 

While `1.` and `2.` are very related and work hand in hand, `3.` is unrelated to them and was
just added here since it is another feature that requires to intercept module loads.

## Creating a Bundle with Packherd

- [implemented inside the packherd module](https://thlorenz.com/packherd/docs/modules/packherd.html)

Calling the [packherd function][packherd fn] and providing the desired [packherd opts][packherd
opts] will return the `Buffer` of the bundle,  a `meta` [esbuild metafile][esbuild metafile], a
`Buffer` containing the sourceMap if it was generated as well as any warnings that esbuild
emitted.

The caller can then store this data or use it for further operations, i.e. to generate a
snapshot as is the case for the [v8-snapshot][v8-snapshot] module.

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

Since packherd cannot know how the modules are keyed inside the maps you should pass a  `getModuleKey`
function of [this type][GetModuleKey] in order to resolve those keys. 

For example in the case of [v8-snapshot][v8-snapshot] the [getModuleKey
implementation][v8-snapshot module key] implementation relies on a resolver map that is
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

I recommend to use the [dirt-simple-file-cache][dirt-simple-file-cache] module to provide the
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

In general I recommend doing this _properly_ via a tool like
[proxyquire][proxyquire], but attempts have been made to work around this by rewriting the JS
that esbuild emits.

Please see the ongoing work inside the `feat/stubbable` branch, particularly the
[transpile-ts-rewrite.ts][packherd rewrite] module.

## Env Vars

- `PACKHERD_CODE_FRAMES` if set will include code snippets for error messages that have been
  sourcemapped

## LICENSE

MIT

[packherd fn]:https://thlorenz.com/packherd/docs/modules/packherd.html#packherd-1
[packherd opts]:https://thlorenz.com/packherd/docs/modules/packherd.html#PackherdOpts
[esbuild metafile]:https://esbuild.github.io/api/#metafile

[require fn]:https://thlorenz.com/packherd/docs/modules/require.html#packherdRequire
[require opts]:https://thlorenz.com/packherd/docs/modules/require.html#PackherdRequireOpts
[transpile opts]:https://thlorenz.com/packherd/docs/modules/types.html#PackherdTranspileOpts
[init transpile cache fn]:https://thlorenz.com/packherd/docs/modules/types.html#InitTranspileCache
[transpile-ts]:https://thlorenz.com/packherd/docs/modules/transpile_ts.html
[packherd rewrite]:https://github.com/thlorenz/packherd/blob/feat/stubbable/src/transpile-ts-rewrite.ts
[GetModuleKey]:https://thlorenz.com/packherd/docs/modules/loader.html#GetModuleKey
[packherd module loader]:https://thlorenz.com/packherd/docs/classes/loader.PackherdModuleLoader.html
[try load]:https://thlorenz.com/packherd/docs/classes/loader.PackherdModuleLoader.html#tryLoad
[try resolve]:https://thlorenz.com/packherd/docs/classes/loader.PackherdModuleLoader.html#tryResolve
[sourcemap docs]:https://thlorenz.com/packherd/docs/modules/sourcemap_support.html

[v8-snapshot]:https://github.com/thlorenz/v8-snapshot
[v8-snapshot module key]:https://github.com/thlorenz/v8-snapshot/blob/master/src/loading/snapshot-require.ts#L20
[proxyquire]:https://github.com/thlorenz/proxyquire
[dirt-simple-file-cache]:https://github.com/thlorenz/dirt-simple-file-cache
[cypress esbuild]:https://github.com/cypress-io/esbuild/tree/thlorenz/snap
