## @packages/v8-snapshot-require

Tool to load a snapshot for Electron applications that was created by `@tooling/v8-snapshot`.

**Table of Contents**

- [Features](#features)
- [Loading From Snapshot](#loading-from-snapshot)
  - [Resolver Map](#resolver-map)
- [Examples](#examples)
- [Debugging and Diagnosing](#debugging-and-diagnosing)

## Features

`@packages/v8-snapshot-require` provides modules snapshotted by `@tooling/v8-snapshot` to `@packages/packherd-require`
and helps in locating modules to load from the snapshot by deriving their keys from information about each
module provided by packherd.

## Loading From Snapshot

In order to facilitate loading from the snapshot, `@packages/v8-snapshot-require` ties into the 
`@packages/packherd-require` resolution mechanism in order to help it obtain the _key_ to locate 
a fully initialized module _exports_ or its _definition_ from the snapshotted Object that
`@packages/v8-snapshot-require` also provides during `@packages/packherd-require` initialization 
inside the [snapshot-require][snapshot-require] setup.

It uses the [resolver-map][resolver-map] in order to resolve modules without querying the file
system.

Once v8-snapshot provides this key to packherd it then tries to first load a fully initialized
version of the module, aka _exports_, falling back to a function which will initialize it, aka
_definitions_ and only finally loads it from the file system via Node.js.

Most of that logic lives inside `@packages/packherd-require` and it is recommended to read its
documentation.

### Resolver Map

The resolver map is constructed from metadata that as [esbuild-snap][esbuild-snap] produces as
a side effect of bundling the application's dependencies and optionally the app's modules.

The keys of this map are the directory relative to the project base dir, from which a module
was resolved, concatenated with the import request string (separated by `'***'`) and the value
the fully resolved path relative to the project base dir.

This map is embedded into the snapshot and used fast module key resolution and used to resolve
a module's key via the [getModuleKey function][getModuleKey-code].

## Examples

In order to learn how to orchestrate snapshot creation and loading please have a look at the
examples provided with this app, for instance:

- [example-express/snapshot/install-snapshot.js](https://github.com/cypress-io/cypress/blob/develop/system-tests/projects/v8-snapshot/example-express/snapshot/install-snapshot.js)
- [example-express/app/hook-require.js](https://github.com/cypress-io/cypress/blob/develop/system-tests/projects/v8-snapshot/example-express/app/hook-require.js)

## Debugging and Diagnosing

In order to gain insight into how the modules are loaded please set the
`DEBUG=(cypress:pack|cypress:snap)*` which will cause the tool to emit a wealth of 
information part of which will provide insight into how many modules were initialized 
from the snapshot and which weren't.

```js
cypress:packherd:debug { exportHits: 20, definitionHits: 8, misses: 3 }
```

It will also provide information about what it encountered inside the snapshot, namely the
number of:

- `exports` modules that are fully initialized inside the snapshot
- `definitions` functions that will return `module.exports` when invoked

NOTE: that `definitions` and `exports` overlap as a module's definition is always included even
if its export is included as well.

Thus the below means that we have `12` modules that are included fully initialized and `6 (18 - 12)` that aren't.

```
exports: 12
definitions: 18
```

[getModuleKey-code]:https://github.com/cypress-io/cypress/blob/develop/packages/v8-snapshot-require/src/snapshot-require.ts#L45

[resolver-map]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/snapshot-generator.ts#L126
[snapshot-require]:https://github.com/cypress-io/cypress/blob/develop/packages/v8-snapshot-require/src/snapshot-require.ts#L187

[esbuild-snap]:https://github.com/cypress-io/esbuild/tree/thlorenz/snap
