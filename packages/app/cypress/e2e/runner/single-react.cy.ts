import { HOST_MODULES_GLOBAL } from '@packages/types/src/host-modules'
import { loadSpec } from './support/spec-loader'

// react-dom tags every root container with `__reactContainer$<key>`, where the
// key is generated once per react-dom instance, so two containers carry the same
// key only when the same copy of react-dom created both roots.
function reactContainerKey (el: HTMLElement) {
  return Object.keys(el).find((key) => key.startsWith('__reactContainer$'))
}

describe('React on the runner page', () => {
  it('renders the reporter with the app\'s React', () => {
    loadSpec({
      filePath: 'runner/simple-single-test.runner.cy.js',
      passCount: 1,
      failCount: 0,
    })

    cy.window().then((win) => {
      const hostModules = Reflect.get(win, HOST_MODULES_GLOBAL)

      expect(hostModules, 'host modules').to.exist
      expect(win.UnifiedRunner.React, 'UnifiedRunner.React').to.equal(hostModules['react'])
      expect(win.UnifiedRunner.ReactDOM.createRoot, 'UnifiedRunner.ReactDOM.createRoot').to.equal(hostModules['react-dom/client'].createRoot)
      expect(win.UnifiedRunner.MobX, 'UnifiedRunner.MobX').to.equal(hostModules['mobx'])

      cy.reporter().find('#unified-reporter').then(($reporterRoot) => {
        const reporterKey = reactContainerKey($reporterRoot[0])

        expect(reporterKey, 'reporter root container key').to.be.a('string')

        const probe = win.document.createElement('div')
        const probeRoot = hostModules['react-dom/client'].createRoot(probe)

        try {
          expect(reactContainerKey(probe), 'app react-dom container key').to.equal(reporterKey)
        } finally {
          probeRoot.unmount()
        }
      })
    })
  })
})
