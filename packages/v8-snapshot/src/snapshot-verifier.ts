import vm from 'vm'

/**
 * Runs the provided `snapshostScript` inside a Node.js VM in order to verify
 * that it completes initialization without errors.
 * Since during the doctor step the bundle is built in _strict_ mode this will
 * also cause an error to be thrown here if we access objects like `Promise`s
 * that we shouldn't since that breaks snapshotting.
 */
export class SnapshotVerifier {
  verify (snapshotScript: Buffer, filename: string) {
    vm.runInNewContext(snapshotScript.toString(), undefined, {
      filename,
      displayErrors: true,
    })
  }
}
