## @tooling/packherd

Herds all dependencies reachable from an entry and packs them.

**Table of Contents**

- [Summary](#summary)
- [Creating a Bundle with Packherd](#creating-a-bundle-with-packherd)

## Summary

packherd has three main tasks:

1. bundling application files and providing related metadata
2. loading modules that have been bundled previously and are provided via fully instantiated
   module exports or definition functions that return a module export when invoked
3. transpiling TypeScript modules on demand and maintaining a cache of them 

`1.` is provided by this package. `2.` and `3.` are provided by `@packages/packherd-require`. While `1.` and `2.` are very related 
and work hand in hand, `3.` is unrelated to them and was just added here since it is another feature that requires to intercept module loads.

## Creating a Bundle with Packherd

Calling the [packherd function][packherd fn] and providing the desired [packherd opts][packherd
opts] will return the `Buffer` of the bundle, a `meta` [esbuild metafile][esbuild metafile], a
`Buffer` containing the sourceMap if it was generated as well as any warnings that esbuild
emitted.

The caller can then store this data or use it for further operations, i.e. to generate a
snapshot as is the case for the [v8-snapshot][v8-snapshot] module.

[packherd fn]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/packherd.ts#L44
[packherd opts]:https://github.com/cypress-io/cypress/blob/develop/packages/packherd/src/packherd.ts#L14-L27
[esbuild metafile]:https://esbuild.github.io/api/#metafile

[v8-snapshot]:https://github.com/thlorenz/v8-snapshot
