## @packages/electron-mksnapshot

A rewrite of [electron/mksnapshot](https://github.com/electron/mksnapshot) to support multiple
versions.

The main difference is that the _mksnapshot_ binary is not downloaded when installing this
module. 

Instead, whenever `electron-mksnapshot` is run an electron version is provided. If that version
was downloaded previously it is used, otherwise the matching version is downloaded before
the _mksnapshot_ step runs.

## Example

```ts
const version = '12.0.10'
const args = [fullPathToSnapshot, '--output_dir', fullPathToOutputDir]
const { version, snapshotBlobFile, v8ContextFile } = await syncAndRun(
  version,
  args
)
assert.equal(version, providedVersion)
assert.equal(snapshotBlobFile, 'snapshot_blob.bin')
assert(v8ContextFile.startsWith('v8_context_snapshot'))
```
