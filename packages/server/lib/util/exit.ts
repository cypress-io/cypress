import { onExit as onExitSignalExit } from 'signal-exit'

// NOTE: this is much easier to test with sinon.stub() as we can stub the export object
// while we convert to TypeScript. Once we migrate to vitest, we can import `signal-exit` directly.
export default {
  ensure: onExitSignalExit,
}
