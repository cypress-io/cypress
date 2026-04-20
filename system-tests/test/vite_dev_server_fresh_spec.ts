import systemTests from '../lib/system-tests'

import type { fixtureDirs } from '@tooling/system-tests'

type ProjectDirs = typeof fixtureDirs

// These versions should reflect the latest versions of each major version of Vite - update as needed
const VITE_REACT: ProjectDirs[number][] = ['vite5.4.18-react', 'vite6.2.5-react', 'vite7.0.0-react', 'vite8.0.0-react']

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
          // AFAICT, vite 8 with rolldown support bundles react differently, so it is available in the "missing react" components and passes
          expectedExitCode: project === 'vite8.0.0-react' ? 5 : 7,
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
