# Cypress Snapshot Package


This package is responsible for integrating with the [v8-snapshot][v8-snapshot].

## Using the Snapshot in Development

### Run Doctor to Create Snapshot

Run `./scripts/setup-dev` which will do the following:

- **consolidateDeps**: removes duplicate  `bluebird` and `lodash` installs in order to minimize
  the number of modules that the [v8-snaphot][v8-snapshot] doctor has to consider and thus
  make it complete much faster, see `./lib/consolidateDeps.js`
- **genMeta**: generates the metadata of the modules to be included in the snapshot. As part of
  that a resolver map is obtained which is used when creating the snapshot, see
  `./lib/gen-meta.js`
- **genEntry**: generates an entry file which imports all dependencies to include in the
  snapshot directly. They are obtained by walking the module tree that is emitted via metadata
  as a side effect of creating the snapshot bundle via [esbuild-snap][esbuild-snap], see
  `./lib/gen-entry.js`
- **installSnapshot**: after the above preparations the snapshot is created involving a doctor
  step if this is the first time or if `node_module` dependencies changed and thus the
  `yarn.lock` file was modified. Then the snapshot is installed into the directory where the
  Cypress app resides. This step is configured inside `./snapconfig.js`. See
  `./lib/install-snapshot.js`

### Loading Modules from the Snapshot

When the app is now started app with `USE_SNAPSHOT=1` set it will load modules from the
embedded snapshot. This functionality is integrated via the `packages/ts` package which hooks
Node.js `requrie` in order to redirect import loads and attempt to load them from the snapshot.

See `../ts/hook-require.js`.

### Troubleshooting

If the app doesn't properly startup and/or behaves buggy it is possible to rule out that this
is due to incorrectly snapshotted modules and/or due to them not loading properly.

All that is needed is to not provide the `USE_SNAPSHOT` env var and the app will not utilize
the snapshotted modules even though the snapshot object still is embedded.

## Using the Snapshot in Production

The main difference _development_ is that here we will include all modules, including our app
files, vs. just the `node_modules` deps.

The `USE_SNAPSHOT` env var is set inside the wrapper script that starts up cypress.

I imagine that `./scripts/setup-prod` would be run in CI as part of creating a release build.

### Omitting Files of Module that Were Embedded from the Release

Modules that can be loaded from the snapshot don't even have to be shipped with the
application. A tool to determine with certainty what still needs to be shipped will need to be
created.
It should hook into the loading of modules while running all Cypress tests and detect for which
the loader falls back to the file system. Only those will need to be shipped.

## Platform Specific Metadata

In order to not have to start the doctor from scratch every time we collect metadata for dev
vs. prod builds for each platform inside the `./cache` dir, i.e.:

```sh
dev-darwin/
prod-darwin/
prod-win32/
```

Each holds the following files:

- `esbuild-meta.json`: metadata about modules included in the snapshotted bundle obtained by
  [esbuild-snap][esbuild-snap], includes all imports for each module
- `snapshot-entry.js`: manufactured entry file which includes an import for each dependency
  reachable from the file used as the snapshot entry, think of it as a flattened out module
  tree. This file is useful when diagnosing problems as imports can be commented out one by
  one.
- `snapshot-meta.json`: contains the _heal state_ produced by running the doctor last run and
  includes _norewrite_, _deferred_ and _healthy_ modules. This is used when we produce the
  snapshot next time as long as the `yarn.lock` file did not change. 
- `snapshot-meta.prev.json`: the metadata of the pen ultimate doctor run. If the `yarn.lock`
  file changes between snapshot setup runs, his is used as the starting point when running the
  doctor to produce updated meta data along with a snapshot script respecting it.
- `snapshot.js`: the snapshot script used to produce the snapshot. It is very large and should
  not be source controlled, instead it serves for diagnostic purposes only after it was used to
  produce the snapshot.


[v8-snapshot]:https://github.com/cypress-io/v8-snapshot

[esbuild-snap]:https://github.com/cypress-io/esbuild/tree/thlorenz/snap
