## @tooling/v8-snapshot

Tool to create a snapshot for Electron applications. Derived and extended immensely from
[electron-link](https://github.com/atom/electron-link).

**Table of Contents**

- [Features](#features)
- [Snapshot Doctor](#snapshot-doctor)
  - [Snapshot Creation](#snapshot-creation)
  - [Requirements](#requirements)
  - [Generating the Snapshot Script](#generating-the-snapshot-script)
  - [Snapshot Doctor: Steps to Optimize Included Modules](#snapshot-doctor-steps-to-optimize-included-modules)
  - [Strict vs. Non-Strict Mode](#strict-vs-non-strict-mode)
  - [Result of Snapshot Doctor](#result-of-snapshot-doctor)
- [Env Vars](#env-vars)

## Features

`@tooling/v8-snapshot` aids in preparing a bundle of modules of an application and/or its dependencies to
allow those modules to be snapshotted via the `mksnapshot` tool. This snapshot can then be embedded
into the Cypress Electron application.

## Snapshot Doctor

The [snapshot-doctor][snapshot-doctor] is responsible for finding the best possible
combination of fully initialized (_healthy_) modules, modules included as definitions only
(_deferred_) and modules which code cannot be modified (_norewrite_).

Please see [docs on the `SnapshotDoctor`][snapshot-doctor-class] for more info about those.

### Snapshot Creation

When creating a snapshot the bundled code provided to it is executed and whatever ends up being
in the heap at the end is then embedded into the snapshot which is loaded whenever the app
starts up.

Once the snapshot is loaded we can retrieve fully instantiated modules from it or instantiate
them by invoking embedded functions which when called produce the `module.exports`.

However since the environment is different when generating the snapshot and not everything is
snapshottable, certain requirements need to be respected.

### Requirements

When creating a snapshot via `mksnapshot` certain requirements need to be respected:

- cannot `require` any Node.js core modules like `fs`
- cannot access and/or instantiate specific JS runtime objects like `Error` or `Promise`
- cannot load Node.js native modules

### Generating the Snapshot Script

In order to generate the snapshot script that is evaluated to produce the snapshot we perform
the following steps:

- create bundle via our [esbuild fork][esbuild-snap] and rewrite sections in order to optimize
  modules included inside the snapshot
- include this bundle inside a wrapper which sets up the `entrypoint` to use when initializing
  the snapshot via evaluation
- embed a [resolver map][resolver-map] explained further below
- optionally embed more, i.e. sourcemaps 

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

Once we have done this for all leaves, the doctor finds all modules that only depend on those and
repeats the process.  However the bundle that is generated takes the current (somewhat less
optimistic) _heal state_ into account and rewrites the code of the dependents to _defer_ loading
the _unhealthy_ leaves.  
The next set of modules to verify is obtained via [the next stage function][doctor-next-stage].

We then repeat this process again for parents of modules we just verified and so on until we
verified all of them.

More nitty gritty details are involved like handling circular imports and it is recommended to
read the [snapshot doctor API][snapshot-doctor-class] and code.

### Strict vs. Non-Strict Mode

Certain snapshot violations don't get caught out of the box when running via the verifier. For
example `new Error(..)` is fine when running inside the Node.js VM, but not so when creating
the snapshot. In that case the error is also very unhelpful as this just results in a
`Segmentation Fault` when running the `mksnapshot` tool. Therefore we need to catch those early
and with a helpful error so that the doctor can figure out the correct consequence.

To achieve that we write a slightly different snapshot script while _doctoring_, see 
[BlueprintConfig#includeStrictVerifiers][blueprint-config]. The code that patches those
problematic _Globals_ can be found inside [globals-strict.js][globals-strict-code].

### Result of Snapshot Doctor

When the snapshot doctor completes you'll find a `snapshot-meta.json` file inside the
_cacheDir_, i.e. `./cache`. This file abbreviated looks like this (for snapshotting an app
using _express).

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

## Env Vars

- `SNAPSHOT_BUNDLER` overrides Go binary to create the JavaScript bundle used to snapshot
- `SNAPSHOT_KEEP_CONFIG` when set will not delete the temporary JSON config file that is
	provided to the snapshot bundler
- `V8_SNAPSHOT_FROM_SCRATCH` will not use the snapshot cache and generate v8 snapshots from scratch
 
[doctor-next-stage]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/doctor/snapshot-doctor.ts#L628
[makeAndInstallSnapshot]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/snapshot-generator.ts#L669

[blueprint-config]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/blueprint.ts#L51
[globals-strict-code]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/blueprint/globals-strict.js

[generation-opts]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/snapshot-generator.ts#L112
[resolver-map]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/snapshot-generator.ts#L126
[snapshot-verifier]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/snapshot-verifier.ts#L10

[snapshot-doctor]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/doctor/snapshot-doctor.ts
[snapshot-doctor-class]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/doctor/snapshot-doctor.ts#L261
[snapshot-doctor-heal]:https://github.com/cypress-io/cypress/blob/develop/tooling/v8-snapshot/src/doctor/snapshot-doctor.ts#L308
[esbuild-snap]:https://github.com/cypress-io/esbuild/tree/thlorenz/snap
