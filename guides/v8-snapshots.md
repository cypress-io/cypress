# V8 Snapshots

In order to improve start up time, Cypress uses [electron mksnapshot](https://github.com/electron/mksnapshot) for generating [v8 snapshots](https://v8.dev/blog/custom-startup-snapshots) for both development and production.

## Snapshot Generation

At a high level, snapshot generation works by creating a single snapshot JS file out of all Cypress server code. In order to do this some code needs to be translated to be "snapshottable". For specifics on what can and can't be snapshot, see [these requirements](https://github.com/cypress-io/cypress/tree/develop/tooling/v8-snapshot#requirements). The JS file that gets generated then runs through [electron mksnapshot](https://github.com/cypress-io/cypress/tree/develop/tooling/electron-mksnapshot) which creates the actual binary snapshot that can be used to load the entire JS file into memory almost instantaneously.

Locally, a v8 snapshot is generated in a post install step and set up to only include node modules in the snapshot. In this way, cypress code can be modified without having to regenerate a snapshot. If you do want or need to regenerate the snapshot for development you can run:

```
yarn build-v8-snapshot-dev
```

On CI and for binary builds we run:

```
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

**Generation**

If the build v8 snapshot command is taking a long time to run on Circle CI, the snapshot cache probably needs to be updated. Run the [Update V8 Snapshot Cache](https://github.com/cypress-io/cypress/actions/workflows/update_v8_snapshot_cache.yml) github action against your branch to generate the snapshots for you on all platforms. You can choose to commit directly to your branch or alternatively issue a PR to your branch.

![Update V8 SnapshotCache](https://user-images.githubusercontent.com/4873279/206541239-1afb1d29-4d66-4593-92a7-5a5961a12137.png)

If the build v8 snapshot command fails, you can sometimes see which file is causing the problem via the stack trace. Running the build snapshot command with `DEBUG=*snap*` set will give you more information. Sometimes you can narrow the issue down to a specific file. If this is the case, you can try removing that file from the snapshot cache at `tooling/v8-snapshot/cache/<platform>/snapshot-meta.json`. If this works, check in the changes and the file will get properly updated in the cache during the next automatic update.

**Runtime**

If you're experiencing issues during runtime, you can try and narrow down where the problem might be via a few different scenarios:

* If the problem occurs with the binary, but not in the monorepo, chances are something is being removed during the binary cleanup step that shouldn't be
* If the problem occurs with running `yarn build-v8-snapshot-prod` but not `yarn build-v8-snapshot-dev`, then that means there's a problem with a cypress file and not a node module dependency. Chances are that a file is not being flagged properly (e.g. healthy when it should be deferred or norewrite).
* If the problem occurs with both `yarn build-v8-snapshot-prod` and `yarn build-v8-snapshot-dev` but does not occur when using the `DISABLE_SNAPSHOT_REQUIRE` environment variable, then that means there's a problem with a node module dependency. Chances are that a file is not being flagged properly (e.g. healthy when it should be deferred or norewrite).
* If the problem still occurs when using the `DISABLE_SNAPSHOT_REQUIRE` environment variable, then that means the problem is not snapshot related.
