<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [v8-snapshot *](#v8-snapshot-)
  - [Features](#features)
  - [Snapshot Doctor](#snapshot-doctor)
    - [Snapshot Creation](#snapshot-creation)
    - [Requirements](#requirements)
    - [Generating the Snapshot Script](#generating-the-snapshot-script)
    - [Snapshot Doctor: Steps to Optimize Included Modules](#snapshot-doctor-steps-to-optimize-included-modules)
    - [Strict vs. Non-Strict Mode](#strict-vs-non-strict-mode)
    - [Result of Snapshot Doctor](#result-of-snapshot-doctor)
  - [Loading From Snapshot](#loading-from-snapshot)
    - [Windows Caveats](#windows-caveats)
    - [Resolver Map](#resolver-map)
  - [Examples](#examples)
  - [Debugging and Diagnosing](#debugging-and-diagnosing)
  - [Env Vars](#env-vars)
  - [External Documentation](#external-documentation)
  - [TODO](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# v8-snapshot [![](https://github.com/thlorenz/v8-snapshot/workflows/Node/badge.svg?branch=master)](https://github.com/thlorenz/v8-snapshot/actions)

Tool to create a snapshot for Electron applications. Derived and extended immensly from
[electron-link](https://github.com/atom/electron-link).

- [API docs](https://cypress-io.github.io/v8-snapshot/docs) _currently not available see TODO below_

## Features

v8-snapshot aids in preparing a bundle of modules of an application and/or its dependencies to
allow those modules to be snapshotted via the `mksnapshot` tool. This snapshot is then embedded
into the Electron application.

v8-snapshot then provides the snapshotted modules to [packherd][packherd] and helps in
locating modules to load from the snapshot by deriving their keys from information about each
module provided by packherd.

## Snapshot Doctor

The [snapshot-doctor][snapshot-doctor] is responsible for finding the best possible
constellation of fully initialized (_healthy_) modules, modules includes as definitions only
(_deferred_) an modules whose code cannot be modified (_norewrites_).

Please see [docs on the `SnapshotDoctor`][snapshot-doctor-class] for more info about those.

### Snapshot Creation

When creating a snapshot the bundled code provided to it is executed and whatever ends up being
in the heap at the end is then embedded into the snapshot which is loaded whenever the app
starts up.

Once the snapshot is loaded we can retrieve fully instantiated modules from it or instantiated
them by invoking embedded functions which when called produce the `module.exports`.

However since the environment is different when generating the snapshot and not everything is
snapshottable, certain requirements need to be respected.

### Requirements

When creating a snapshot via `mksnapshot` certain requirements need to be respected:

- cannot `require` and Node.js core modules like `fs`
- cannot access and/or instantiate specific JS runtime objects like `Error` or `Promise`
- cannot load Node.js native modules

### Generating the Snapshot Script

In order to generate the snapshot script that is evaluated to produce the snapshot we perform
the following steps:

- create bundle via our [esbuild fork][esbuild-snap] and rewrite sections in order to optimize
  modules included inside the snapshot
- include this bundle inside a wrapper which sets up the `entrypoint` to use when initializing
  the snapshot via evaluation
- embedd a [resolver map][resolver-map] explained further below
- optionally embedd more, i.e. sourcemaps 

The snapshot script can be generated in a manner that only includes `node_modules`, i.e.
dependencies of the app which is recommended while developing the app in order to not have to
create a new one after each change to application files. See [GenerationOpts][generation-opts]
`nodeModulesOnly`.

### Snapshot Doctor: Steps to Optimize Included Modules

The snapshot doctor steps are documented as part of the [heal method
docs][snapshot-doctor-heal] and are as follows.

We basically are trying to initialize a module's `exports` without violating any of the
requirements.

The doctor starts with an empty `healState` which means it optimistically assumes that all
modules can be included in the snapshot fully initialized.

NOTE: that the healState can be derived from metadata collected during previous doctor runs,
but here we assume the simplified case.

The doctor then produces the initial snapshot script and starts by verifying the leaf modules
which are modules that have no imports of other user land modules.

Using that same bundle it produces different snapshot scripts, each making another module to be
verified be the entry point. This is parallelized via workers, i.e. a bundle will run as many
verifiers as the machine has CPUs.

Each produced snapshot script is executed inside a Node.js VM via the
[snapshot-verifier][snashot-verifier]. Any errors are observed, processed into warnings and the
necessary consequence taken.
The possible consequences affect the module we verified in the following manner:

- Defer: we need to _defer_ the module in order to prevent it from loading
- NoRewrite: we should not _rewrite_ the module as it results in invalid code
- None: no consequence, i.e. a light weight warning for informative purposes only

Once we did this for all leaves the doctor finds all modules that only depend on those and
repeats the process.  However the bundle that is generated takes the current (somewhat less
optimistic _heal state_ into account and rewrites the code of the dependents to _defer_ loading
the _unhealthy_ leaves.  
The next set of modules to verify is obtained via [the next stage function][doctor-next-stage].

We then repeat this process again for parents of modules we just verified and so on until we
verified all of them.

More nitty gritty details are involved like handling circular imports and it is recommended to
read the [snapshot doctor API][doctor-class] and code.

### Strict vs. Non-Strict Mode

Certain snapshot violations don't get caught out of the box when running via the verifier. For
example `new Error(..)` is fine when running inside the Node.js VM, but not so when creating
the snapshot. In that case the error is also very unhelpful as this just results in a
`Segmentation Fault` when running the `mksnapshot` tool. Therefore we need to catch those early
and with a helpful error so that the doctor can figure out the correct consequence.

To archieve that we write a slightly different snapshot script while _doctoring_, see 
[BlueprintConfig#includeStrictVerifiers][blueprint-config]. The code that patches those
problematic _Globals_ can be found inside [globals-strict.js][globals-strict-code].

### Result of Snapshot Doctor

When the snapshot doctor completes you'll find a `snapshot-meta.json` file inside the
_cacheDir_, i.e. `./cache`. This file abbreviated looks like this (for snapshotting an app
using _expresss).

```json
{
  "norewrite": [],
  "deferred": [
    "./node_modules/body-parser/index.js",
    "./node_modules/debug/src/browser.js",
    ".. many more ..",
    "./node_modules/send/index.js",
    "./node_modules/send/node_modules/http-errors/index.js"
  ],
  "healthy": [
    "./node_modules/accepts/index.js",
    "./node_modules/array-flatten/array-flatten.js",
    "./node_modules/body-parser/lib/read.js",
    "./node_modules/body-parser/lib/types/json.js",
    ".. many more ..",
    "./node_modules/unpipe/index.js",
    "./node_modules/utils-merge/index.js",
    "./node_modules/vary/index.js",
    "./snapshot/snapshot.js"
  ],
  "deferredHashFile": "yarn.lock",
  "deferredHash": "216a61df3760151255ce41db2a279ab4d83b4cb053687766b65b19c4010753a2"
}
```

As you can see this meta file can be used as is as long as the content of the `yarn.lock` file
doesn't change and in that case the doctor step does not have to be repeated.

Another option is to provide the meta information to the doctor via `previousDeferred`,
`previousHealthy`, etc. in order to have it use this information instead of starting totally
from scratch.

Aside from this script the snapshot generator allows making and installing the snapshot into
our app. See [makeAndInstallSnapshot][makeAndInstallSnapshot].

## Loading From Snapshot

In order to facilitate loading from the snapshot, v8-snapshot ties into the [packerd][packherd]
resolution mechanism in order to help it obtain the _key_ to locate a fully initialized module
_exports_ or its _definition_ from the snapshotted Object that v8-snasphot also provides during
[packherd][packherd] initialization inside the [snapshot-require][snapshot-require] setup.

It uses the [resolver-map][resolver-map] in order to resolve modules without querying the file
system.

Once v8-snapshot provides this key to packherd it then tries to first load a fully initialized
version of the module, aka _exports_, falling back to a function which will initialize it, aka
_definitions_ and only finally loads it from the file system via Node.js.

Most of that logic lives inside [packherd][packherd] and it is recommended to read its
documentation.

### Windows Caveats

Since v8-snapshot and packherd rely heavily on path derived keys issues were encountered when
trying to use it on Windows. It was developed solely on operating systems, i.e. OSX and Linux
and only rather late tested on Windows. The fact that it uses `\` instead of `/` to separate
paths is respoonsible for a bulk of those issues.

The first part of the solution was to normalize the output of the [esbuild snap][esbuild-snap]
tool. All module hashes in the bundle use forward slashes and the same is true for all output
metadata.

v8-snapshot was then adapted to consider this when resolving keys on all platforms as well as
when modules have to be loaded from the file system.

However some unsolved issues remain resulting in the integration test not passing on windows.

### Resolver Map

The resolver map is constructed from metadata that as [esbuild-snap][esbuild-snap] produces as
a side effect of bundling the application's dependencies and optionally the app's modules.

The keys of this map are the directory relative to the project base dir, from which a module
was resolved, concatentated with the import request string (seprated by `'***'`) and the value
the fully resolved path relative to the project base dir.

This map is embedded into the snapshot and used fast module key resolution and used to resolve
a module's key via the [getModuleKey function][getModuleKey-code].

## Examples

In order to learn how to orchestrate snapshot creation and loading please have a look at the
examples provided with this app, for instance:

- [example-express/snapshot/install-snasphot.js](https://github.com/cypress-io/v8-snapshot/blob/99c80ff79416a061be304653dcfa2741c58b4a06/example-express/snapshot/install-snapshot.js)
- [example-express/app/hook-require.js](https://github.com/cypress-io/v8-snapshot/blob/99c80ff79416a061be304653dcfa2741c58b4a06/example-express/app/hook-require.js)

## Debugging and Diagnosing

In order to gain insight into the doctor step as well as loading modules please set the
`DEBUG=(pack|snap)*` which will cause the tool to emit a wealth of information part of which
will provide insight into how many modules were initialized from the snapshot and which
weren't.

```js
packherd:debug { exportHits: 20, definitionHits: 8, misses: 3 }
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

## Env Vars

- `SNAPSHOT_BUNDLER` overrides Go binary to create the JavaScript bundle used to snapshot
- `SNAPSHOT_KEEP_CONFIG` when set will not delete the temporary JSON config file that is
	provided to the snapshot bundler
	
## External Documentation

- [Overview of Snapshot Creation and Module Loading](https://miro.com/app/board/o9J_lnvMx34=/)
- [Snapshot Architecture Miro](https://miro.com/app/board/o9J_l_DGx_0=/) focuses on TypeScript
  transpilation
- [Snapshot Require Miro](https://miro.com/app/board/o9J_l3XYLEc=/)


## TODO

When creating those links the `gh-pages` branch failed to render the docs at
`https://cypress-io.github.io/v8-snapshot/docs` like it does for [packherd
docs](https://cypress-io.github.io/packherd/docs) and I didn't have access to the repo
settings to go about fixing that.

Once it is fixed please replace `file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs` with
`https://cypress-io.github.io/packherd/docs` everywhere in this document.
 
[doctor-next-stage]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/classes/doctor_snapshot_doctor.SnapshotDoctor.html#_findNextStage
[doctor-class]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/classes/doctor_snapshot_doctor.SnapshotDoctor.html
[makeAndInstallSnapshot]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/classes/snapshot_generator.SnapshotGenerator.html#makeAndInstallSnapshot

[blueprint-config]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/modules/blueprint.html#BlueprintConfig
[globals-strict-code]:https://github.com/cypress-io/v8-snapshot/blob/99c80ff79416a061be304653dcfa2741c58b4a06/src/blueprint/globals-strict.js

[getModuleKey-code]:https://github.com/cypress-io/v8-snapshot/blob/99c80ff/src/loading/snapshot-require.ts#L43

[generation-opts]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/modules/snapshot_generator.html#GenerationOpts
[resolver-map]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/modules/snapshot_generator.html#GenerationOpts
[snapshot-verifier]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/classes/snapshot_verifier.SnapshotVerifier.html
[snapshot-require]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/modules/loading_snapshot_require.html#snapshotRequire

[packherd]:https://github.com/cypress-io/packherd
[snapshot-doctor]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/modules/doctor_snapshot_doctor.html
[snapshot-doctor-class]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/classes/doctor_snapshot_doctor.SnapshotDoctor.html
[snapshot-doctor-heal]:file:///Volumes/d/dev/cy/perf-tr1/v8-snapshot/docs/classes/doctor_snapshot_doctor.SnapshotDoctor.html#heal
[esbuild-snap]:https://github.com/cypress-io/esbuild/tree/thlorenz/snap
