import systemTests from '../lib/system-tests'

import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

// Match vite-dev-server e2e: Vite 8 fixture only (precursor to dropping older majors in Cypress 16)
const VITE_REACT: ProjectDirs[number][] = ['vite8.0.0-react']

describe('@cypress/vite-dev-server', function () {
  systemTests.setup()

  describe('react', () => {
    for (const project of VITE_REACT) {
      it(`executes all of the specs for ${project}`, function () {
        return systemTests.exec(this, {
          project,
          configFile: 'cypress-vite.config.ts',
          testingType: 'component',
          browser: 'chrome',
          snapshot: true,
          // @see https://github.com/cypress-io/cypress/issues/30881 and src/Rerendering.cy.jsx for details on skipping.
          spec: 'src/**/*.cy.jsx,!src/Rerendering.cy.jsx',
          expectedExitCode: 7,
        })
      })

      systemTests.it(`executes the port.cy.jsx spec for ${project} when port is statically configured`, {
        project,
        configFile: 'cypress-vite-port.config.ts',
        spec: 'src/port.cy.jsx',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 0,
      })
    }
  })
})
