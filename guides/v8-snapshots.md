# V8 Snapshots

In order to improve start up time, Cypress uses [electron mksnapshot](https://github.com/electron/mksnapshot) for generating [v8 snapshots](https://v8.dev/blog/custom-startup-snapshots) for both development and production.

## Snapshot Generation

At a high level, snapshot generation works by creating a single snapshot JS file out of all Cypress server code. In order to do this some code needs to be translated to be "snapshottable". For specifics on what can and can't be snapshot, see [these requirements](https://github.com/cypress-io/cypress/tree/develop/tooling/v8-snapshot#requirements). The JS file that gets generated then runs through [electron mksnapshot](https://github.com/cypress-io/cypress/tree/develop/tooling/electron-mksnapshot) which creates the actual binary snapshot that can be used to load the entire JS file into memory almost instantaneously.

Locally, a v8 snapshot is generated in a post install step and set up to only include node modules in the snapshot. In this way, cypress code can be modified without having to regenerate a snapshot. If you do want or need to regenerate the snapshot for development you can run:

```shell
yarn build-v8-snapshot-dev
```

On CI and for binary builds we run:

```shell
yarn build-v8-snapshot-prod
```

which will include both node modules and cypress code in the snapshot.

## Environment Variables

* `DISABLE_SNAPSHOT_REQUIRE` - disables snapshot require and the snapshot build process when running `yarn install`
* `V8_SNAPSHOT_DISABLE_MINIFY` - disables the minification process during a V8 snapshot production build. This speeds up the build time greatly. It is useful when building the Cypress binary locally

## Cache

Because the V8 snapshot process involves analyzing every file to determine whether it can be properly snapshot or not, this process can be time consuming. In order to make this process faster, there is a cache file that is stored at `tooling/v8-snapshot/cache/<platform>/snapshot-meta.json`. This file specifies the snapshotability of each file. The snapshot process uses this snapshot meta file as a starting guess as to all of the files snapshot status. It can then detect new problems per file and thus only have to process new or newly problematic files, thus speeding up the overall process.

This cache should be maintained and updated over time. Rather than having this maintenance be a manual process done by developers, a [github action](https://github.com/cypress-io/cypress/blob/develop/.github/workflows/update_v8_snapshot_cache.yml) is used. It is scheduled to run nightly and issues a PR to develop with any changes to the cache files. Because the iterative snapshot process is good at transitioning files from a healthy status to unhealthy but not the other way, we generate the snapshot from scratch weekly to try and keep the cache as optimal as possible. Generating from scratch is a very lengthy process (on the order of hours) which is why this is only done weekly.

## Troubleshooting

### Local Development

If you're running into problems locally, either with generating the snapshot or at runtime, a good first step is to clean everything and start from scratch. This command will accomplish that (note that it will delete any new unstaged files, so if you want to keep them, either stash them or stage them):

```shell
git clean -fxd && yarn
```

### Generation

If the build v8 snapshot command is taking a long time to run on Circle CI, the snapshot cache probably needs to be updated. Run the [Update V8 Snapshot Cache](https://github.com/cypress-io/cypress/actions/workflows/update_v8_snapshot_cache.yml) github action against your branch to generate the snapshots for you on all platforms. You can choose to commit directly to your branch or alternatively issue a PR to your branch.

![Update V8 SnapshotCache](https://user-images.githubusercontent.com/4873279/206541239-1afb1d29-4d66-4593-92a7-5a5961a12137.png)

If the build v8 snapshot command fails, you can sometimes see which file is causing the problem via the stack trace. Running the build snapshot command with `DEBUG=*snap*` set will give you more information. Sometimes you can narrow the issue down to a specific file. If this is the case, you can try removing that file from the snapshot cache at `tooling/v8-snapshot/cache/<platform>/snapshot-meta.json`. If this works, check in the changes and the file will get properly updated in the cache during the next automatic update.

### If a Full Snapshot Rebuild Still Fails

Occasionally, a full rebuild will still fail. This is typically a sign that there is a problem with the code we are generating, with Electron's `mksnapshot` or even deeper with the pure v8 `mksnapshot`. The first thing to be done is to figure out where the problem actually is.

To determine if the problem is with the pure v8 `mksnapshot`, [check out](https://v8.dev/docs/source-code), [build](https://v8.dev/docs/build-gn), and run [the v8 `mksnapshot` code](https://github.com/v8/v8/). Then you can run the built `mksnapshot` against the generated snapshot file at `tooling/v8-snapshot/cache/darwin/snapshot.js`. For example on an M1, you would run `tools/dev/gm.py arm64.release` and once that builds, you can run `mksnapshot` via: `out/arm64.release/mksnapshot <path-to-snapshot>`. Then, it's just a matter of figuring out where that commit is that introduces the problem. A good strategy is to check out the tag of the release corresponding to the electron version where everything is working and verify it works. Then check out the tag of the release corresponding to the electron version where everything is not working and verify that it is broken. Then use a binary search on the commits in between to find the place where things break.

To determine if the problem is with Electron's `mksnapshot`, [check out, build](https://www.electronjs.org/docs/latest/development/build-instructions-gn) and run [the electron `mksnapshot` code](https://github.com/electron/electron). Using [Electron's build tools](https://github.com/electron/build-tools) is strongly recommended. An example of what the process looks like would be running `e build mksnapshot` to build the mksnapshot target and then executing `src/out/Release/mksnapshot <path-to-snapshot>` to try and generate the snapshot. A good strategy is to check out the tag of the release corresponding to the electron version where everything is working and verify it works. Then check out the tag of the release corresponding to the electron version where everything is not working and verify that it is broken. Then use a binary search on the commits in between to find the place where things break. If you have determined that the problem is not with the pure v8 `mksnapshot`, then the issue is likely with one of the patches that electron applied on top of v8.

To determine if the problem is with the code we are generating, run `V8_SNAPSHOT_DISABLE_MINIFY=1 DEBUG=*snap* yarn build-v8-snapshot-prod`. The failure will spell out a command like `node /Users/user1/cypress/tooling/electron-mksnapshot/dist/mksnapshot-bin.js /Users/user1/cypress/tooling/v8-snapshot/cache/darwin/snapshot.js --output_dir /private/var/folders/9z/qzyh61x16tv5y874h_8297m40000gq/T/cy-v8-snapshot-bin`. Running that by itself will then spell out another command like `/private/var/folders/9z/qzyh61x16tv5y874h_8297m40000gq/T/mksnapshot-workdir/mksnapshot /Users/user1/cypress/tooling/v8-snapshot/cache/darwin/snapshot.js --turbo_instruction_scheduling --stress-turbo-late-spilling --target_os=mac --target_arch=arm64 --embedded_src gen/v8/embedded.S --embedded_variant Default --random-seed 314159265 --startup_blob snapshot_blob.bin --no-native-code-counters`. This last command can be used for further iterative troubleshooting. A good approach for troubleshooting involves looking at the snapshot file (`/Users/user1/cypress/tooling/v8-snapshot/cache/darwin/snapshot.js` in the above example) and commenting out various files referenced in the `// tooling/v8-snapshot/cache/darwin/snapshot-entry.js` section. If you can narrow it down to a specific file causing the problem, you can further try and narrow it down to a line of code in that file. If it is a specific line, there are two options: tweak the line in the source code to see if there's a way to cause it not to have a problem or fix the code generation at `https://github.com/cypress-io/esbuild`.

### Runtime

If you're experiencing issues during runtime, you can try and narrow down where the problem might be via a few different scenarios:

* If the problem occurs with the binary, but not in the monorepo, chances are something is being removed during the binary cleanup step that shouldn't be
* If the problem occurs with running `yarn build-v8-snapshot-prod` but not `yarn build-v8-snapshot-dev`, then that means there's a problem with a cypress file and not a node module dependency. Chances are that a file is not being flagged properly (e.g. healthy when it should be deferred or norewrite).
* If the problem occurs with both `yarn build-v8-snapshot-prod` and `yarn build-v8-snapshot-dev` but does not occur when using the `DISABLE_SNAPSHOT_REQUIRE` environment variable, then that means there's a problem with a node module dependency. Chances are that a file is not being flagged properly (e.g. healthy when it should be deferred or norewrite).
* If the problem still occurs when using the `DISABLE_SNAPSHOT_REQUIRE` environment variable, then that means the problem is not snapshot related.
