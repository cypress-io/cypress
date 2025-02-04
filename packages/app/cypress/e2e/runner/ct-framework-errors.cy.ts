import type { ProjectFixtureDir } from '@tooling/system-tests/'
import { createVerify } from './support/verify-failures'

type VerifyFunc = (specTitle: string, verifyOptions: any) => Cypress.Chainable

type Options = {
  projectName: ProjectFixtureDir
  configFile: string
  filePath: string
  failCount: number
  passCount?: number
}

Cypress.on('uncaught:exception', () => false)

// https://github.com/cypress-io/cypress/issues/23920
function verifyErrorOnlyCapturedOnce (err: string) {
  let count = 0

  return cy.get('.command-message-text').each(($el) => {
    if ($el.text().includes(err)) {
      count++
    }
  }).then(() => {
    // ensures the error is not double-captured (as per #23920)
    expect(count).to.eq(1)
  })
}
/**
 * Navigates to desired error spec file within Cypress app and waits for completion.
 * Returns scoped verify function to aid inner spec validation.
 */
function loadErrorSpec (options: Options): VerifyFunc {
  const { projectName, filePath, failCount, passCount = '--', configFile } = options

  cy.openProject(projectName, ['--config-file', configFile, '--component'])
  cy.startAppServer('component')
  cy.visitApp(`specs/runner?file=${filePath}`)

  cy.get('.runnable-header', { log: false }).should('be.visible')
  // Extended timeout needed due to lengthy Angular bootstrap on Windows
  cy.contains('Your tests are loading...', { timeout: 60000, log: false }).should('not.exist')
  // Then ensure the tests have finished
  cy.get('[aria-label="Rerun all tests"]', { timeout: 30000 })
  cy.findByLabelText('Stats').within(() => {
    cy.get('.passed .num').should('have.text', `${passCount}`)
    cy.get('.failed .num').should('have.text', `${failCount}`)
  })

  // Return scoped verify function with spec options baked in
  return createVerify({ fileName: Cypress._.last(filePath.split('/')), hasPreferredIde: false, mode: 'component' })
}

const reactVersions = [18, 19] as const

reactVersions.forEach((reactVersion) => {
  describe(`React ${reactVersion}`, {
    viewportHeight: 768,
    viewportWidth: 1024,
    // Limiting tests kept in memory due to large memory cost
    // of nested spec snapshots
    numTestsKeptInMemory: 1,
  }, () => {
    beforeEach(() => {
      cy.scaffoldProject(`react${reactVersion}`)
    })

    it('error conditions', () => {
      const verify = loadErrorSpec({
        projectName: `react${reactVersion}`,
        configFile: 'cypress-vite-default.config.ts',
        filePath: 'src/Errors.cy.jsx',
        failCount: 4,
      })

      verify('error on mount', {
        line: 5,
        column: 33,
        uncaught: true,
        uncaughtMessage: 'mount error',
        message: [
          'The following error originated from your application code',
          'mount error',
        ],
        codeFrameText: 'Errors.cy.jsx',
      })

      verify('sync error', {
        line: 12,
        column: 19,
        uncaught: true,
        uncaughtMessage: 'sync error',
        message: [
          'The following error originated from your application code',
          'sync error',
        ],
        codeFrameText: 'Errors.cy.jsx',
      }).then(() => {
      // TODO: ReactDOM seems to double throw.
      // verifyErrorOnlyCapturedOnce('Error: sync error')
      })

      verify('async error', {
        line: 21,
        column: 21,
        uncaught: true,
        uncaughtMessage: 'async error',
        message: [
          'The following error originated from your application code',
          'async error',
        ],
        codeFrameText: 'Errors.cy.jsx',
      }).then(() => {
        // TODO: ReactDOM seems to double throw.
        // verifyErrorOnlyCapturedOnce('Error: async error')
      })

      verify('command failure', {
        line: 47,
        column: 8,
        command: 'get',
        message: [
          'Timed out retrying',
          'element-that-does-not-exist',
        ],
      })
    })
  })
})

describe('Next.js', {
  viewportHeight: 768,
  viewportWidth: 1024,
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  beforeEach(() => {
    cy.scaffoldProject('next-14')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'next-14',
      configFile: 'cypress.config.js',
      filePath: 'cypress/Errors.cy.jsx',
      failCount: 4,
    })

    verify('error on mount', {
      line: 6,
      column: 33,
      uncaught: true,
      uncaughtMessage: 'mount error',
      message: [
        'The following error originated from your application code',
        'mount error',
      ],
      codeFrameText: 'Errors.cy.jsx',
    })

    verify('sync error', {
      line: 13,
      column: 19,
      uncaught: true,
      uncaughtMessage: 'sync error',
      message: [
        'The following error originated from your application code',
        'sync error',
      ],
      codeFrameText: 'Errors.cy.jsx',
    }).then(() => {
      // TODO: ReactDOM seems to double throw.
      // verifyErrorOnlyCapturedOnce('Error: sync error')
    })

    verify('async error', {
      line: 22,
      column: 21,
      uncaught: true,
      uncaughtMessage: 'async error',
      message: [
        'The following error originated from your application code',
        'async error',
      ],
      codeFrameText: 'Errors.cy.jsx',
    }).then(() => {
      verifyErrorOnlyCapturedOnce('Error: async error')
    })

    verify('command failure', {
      line: 48,
      column: 8,
      command: 'get',
      message: [
        'Timed out retrying',
        'element-that-does-not-exist',
      ],
    })
  })
})

describe('Vue', {
  viewportHeight: 768,
  viewportWidth: 1024,
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  beforeEach(() => {
    cy.scaffoldProject('vue3-webpack-ts-configured')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'vue3-webpack-ts-configured',
      configFile: 'cypress.config.ts',
      filePath: 'src/components/Errors.cy.ts',
      failCount: 4,
    })

    verify('error on mount', {
      fileName: 'Errors.vue',
      line: 29,
      column: 13,
      message: [
        'mount error',
      ],
      codeFrameText: 'Errors.vue',
    })

    verify('sync error', {
      fileName: 'Errors.vue',
      line: 34,
      column: 13,
      uncaught: true,
      uncaughtMessage: 'sync error',
      message: [
        'The following error originated from your application code',
        'sync error',
      ],
      codeFrameText: 'Errors.vue',
    }).then(() => {
      verifyErrorOnlyCapturedOnce('Error: sync error')
    })

    verify('async error', {
      fileName: 'Errors.vue',
      line: 38,
      column: 15,
      uncaught: true,
      uncaughtMessage: 'async error',
      message: [
        'The following error originated from your application code',
        'async error',
      ],
      codeFrameText: 'Errors.vue',
    }).then(() => {
      verifyErrorOnlyCapturedOnce('Error: async error')
    })

    verify('command failure', {
      command: 'get',
      message: [
        'Timed out retrying',
        'element-that-does-not-exist',
      ],
      codeFrameRegex: /Errors\.cy\.ts:32/,
      stackRegex: /Errors\.cy\.ts:32/,
    })
  })
})

// TODO: Svelte sourcemaps are generated but are not working properly on Webpack or Vite
//       https://github.com/cypress-io/cypress/issues/23918
describe.skip('Svelte', {
  viewportHeight: 768,
  viewportWidth: 1024,
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  beforeEach(() => {
    cy.scaffoldProject('svelte-webpack-configured')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'svelte-webpack-configured',
      configFile: 'cypress.config.js',
      filePath: 'src/errors.cy.js',
      failCount: 4,
    })

    verify('error on mount', {
      message: [
        'mount error',
      ],
      hasCodeFrame: false,
      codeFrameRegex: /spec-1.js:70:9/,
      stackRegex: /spec-1.js:70:9/,
    })

    verify('sync error', {
      // fileName: 'Errors.vue',
      line: 24,
      column: 16,
      uncaught: true,
      message: [
        'The following error originated from your application code',
        'sync error',
      ],
    }).then(() => {
      verifyErrorOnlyCapturedOnce('Error: sync error')
    })

    verify('async error', {
      // fileName: 'Errors.vue',
      line: 28,
      column: 18,
      uncaught: true,
      message: [
        'The following error originated from your application code',
        'async error',
      ],
      // codeFrameText: 'Errors.vue',
    }).then(() => {
      verifyErrorOnlyCapturedOnce('Error: async error')
    })

    verify('command failure', {
      command: 'get',
      message: [
        'Timed out retrying',
        'element-that-does-not-exist',
      ],
      codeFrameRegex: /errors\.cy\.js:26/,
      stackRegex: /errors\.cy\.js:26/,
    })
  })
})

const angularVersions = [17, 18] as const

angularVersions.forEach((angularVersion) => {
  describe(`Angular ${angularVersion}`, {
    viewportHeight: 768,
    viewportWidth: 1024,
    // Limiting tests kept in memory due to large memory cost
    // of nested spec snapshots
    numTestsKeptInMemory: 1,
  }, () => {
    beforeEach(() => {
      cy.scaffoldProject(`angular-${angularVersion}`)
    })

    it('error conditions', () => {
      const verify = loadErrorSpec({
        projectName: `angular-${angularVersion}`,
        configFile: 'cypress.config.ts',
        filePath: 'src/app/errors.cy.ts',
        failCount: 3,
        passCount: 1,
      })

      verify('sync error', {
        fileName: 'errors.ts',
        line: 14,
        column: 11,
        uncaught: true,
        uncaughtMessage: 'sync error',
        message: [
          'The following error originated from your application code',
          'sync error',
        ],
      }).then(() => {
        verifyErrorOnlyCapturedOnce('Error: sync error')
      })

      verify('async error', {
        fileName: 'errors.ts',
        line: 19,
        column: 13,
        uncaught: true,
        uncaughtMessage: 'async error',
        message: [
          'The following error originated from your application code',
          'async error',
        ],
      }).then(() => {
        verifyErrorOnlyCapturedOnce('Error: async error')
      })

      verify('command failure', {
        line: 20,
        column: 8,
        command: 'get',
        message: [
          'Timed out retrying',
          'element-that-does-not-exist',
        ],
      })
    })
  })
})
