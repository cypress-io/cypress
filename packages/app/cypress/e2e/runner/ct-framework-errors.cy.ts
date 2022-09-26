import type { ProjectFixtureDir } from '@tooling/system-tests/'
import { createVerify } from './support/verify-failures'

type VerifyFunc = (specTitle: string, verifyOptions: any) => void

type Options = {
  projectName: ProjectFixtureDir
  configFile: string
  filePath: string
  failCount: number
  passCount?: number
}

Cypress.on('uncaught:exception', () => false)

/**
 * Navigates to desired error spec file within Cypress app and waits for completion.
 * Returns scoped verify function to aid inner spec validation.
 */
function loadErrorSpec (options: Options): VerifyFunc {
  const { projectName, filePath, failCount, passCount = '--', configFile } = options

  cy.openProject(projectName, ['--config-file', configFile])
  cy.startAppServer('component')
  cy.visitApp(`specs/runner?file=${filePath}`)

  cy.findByLabelText('Stats', { timeout: 30000 }).within(() => {
    cy.get('.passed .num', { timeout: 30000 }).should('have.text', `${passCount}`)
    cy.get('.failed .num', { timeout: 30000 }).should('have.text', `${failCount}`)
  })

  // Return scoped verify function with spec options baked in
  return createVerify({ fileName: Cypress._.last(filePath.split('/')), hasPreferredIde: false, mode: 'component' })
}

const reactVersions = [17, 18] as const

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
        configFile: 'cypress-vite.config.ts',
        filePath: 'src/Errors.cy.jsx',
        failCount: 4,
      })

      verify('error on mount', {
        line: 6,
        column: 33,
        uncaught: true,
        uncaughtMessage: 'mount error',
        message: [
          'The following error originated from your test code',
          'mount error',
        ],
        codeFrameText: 'Errors.cy.jsx',
      })

      verify('sync error', {
        line: 11,
        column: 34,
        uncaught: true,
        uncaughtMessage: 'sync error',
        message: [
          'The following error originated from your test code',
          'sync error',
        ],
        codeFrameText: 'Errors.cy.jsx',
      })

      verify('async error', {
        line: 18,
        column: 38,
        uncaught: true,
        uncaughtMessage: 'async error',
        message: [
          'The following error originated from your test code',
          'async error',
        ],
        codeFrameText: 'Errors.cy.jsx',
      })

      verify('command failure', {
        line: 43,
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
    cy.scaffoldProject('next-12')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'next-12',
      configFile: 'cypress.config.js',
      filePath: 'cypress/Errors.cy.jsx',
      failCount: 4,
    })

    verify('error on mount', {
      line: 7,
      column: 33,
      uncaught: true,
      uncaughtMessage: 'mount error',
      message: [
        'The following error originated from your test code',
        'mount error',
      ],
      codeFrameText: 'Errors.cy.jsx',
    })

    verify('sync error', {
      line: 12,
      column: 34,
      uncaught: true,
      uncaughtMessage: 'sync error',
      message: [
        'The following error originated from your test code',
        'sync error',
      ],
      codeFrameText: 'Errors.cy.jsx',
    })

    verify('async error', {
      line: 19,
      column: 38,
      uncaught: true,
      uncaughtMessage: 'async error',
      message: [
        'The following error originated from your test code',
        'async error',
      ],
      codeFrameText: 'Errors.cy.jsx',
    })

    verify('command failure', {
      line: 44,
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
    cy.scaffoldProject('vuecli5-vue3')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'vuecli5-vue3',
      configFile: 'cypress.config.ts',
      filePath: 'src/components/Errors.cy.js',
      failCount: 4,
    })

    verify('error on mount', {
      fileName: 'Errors.vue',
      line: 19,
      column: 16,
      message: [
        'mount error',
      ],
      codeFrameText: 'Errors.vue',
    })

    verify('sync error', {
      fileName: 'Errors.vue',
      line: 24,
      column: 16,
      uncaught: true,
      uncaughtMessage: 'sync error',
      message: [
        'The following error originated from your test code',
        'sync error',
      ],
      codeFrameText: 'Errors.vue',
    })

    verify('async error', {
      fileName: 'Errors.vue',
      line: 28,
      column: 18,
      uncaught: true,
      uncaughtMessage: 'async error',
      message: [
        'The following error originated from your test code',
        'async error',
      ],
      codeFrameText: 'Errors.vue',
    })

    verify('command failure', {
      command: 'get',
      message: [
        'Timed out retrying',
        'element-that-does-not-exist',
      ],
      codeFrameRegex: /Errors\.cy\.js:26/,
      stackRegex: /Errors\.cy\.js:26/,
    })
  })
})

describe('Nuxt', {
  viewportHeight: 768,
  viewportWidth: 1024,
  // Limiting tests kept in memory due to large memory cost
  // of nested spec snapshots
  numTestsKeptInMemory: 1,
}, () => {
  beforeEach(() => {
    cy.scaffoldProject('nuxtjs-vue2-configured')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'nuxtjs-vue2-configured',
      configFile: 'cypress.config.js',
      filePath: 'components/Errors.cy.js',
      failCount: 3,
    })

    verify('error on mount', {
      fileName: 'Errors.vue',
      line: 19,
      message: [
        'mount error',
      ],
      stackRegex: /Errors\.vue:19/,
      codeFrameText: 'Errors.vue',
    })

    verify('async error', {
      fileName: 'Errors.vue',
      line: 28,
      uncaught: true,
      uncaughtMessage: 'async error',
      message: [
        'The following error originated from your test code',
        'async error',
      ],
      stackRegex: /Errors\.vue:28/,
      codeFrameText: 'Errors.vue',
    })

    verify('command failure', {
      command: 'get',
      message: [
        'Timed out retrying',
        'element-that-does-not-exist',
      ],
      codeFrameRegex: /Errors\.cy\.js:26/,
      stackRegex: /Errors\.cy\.js:26/,
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
    cy.scaffoldProject('svelte-webpack')
  })

  it('error conditions', () => {
    const verify = loadErrorSpec({
      projectName: 'svelte-webpack',
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
        'The following error originated from your test code',
        'sync error',
      ],
    })

    verify('async error', {
      // fileName: 'Errors.vue',
      line: 28,
      column: 18,
      uncaught: true,
      message: [
        'The following error originated from your test code',
        'async error',
      ],
      // codeFrameText: 'Errors.vue',
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

const angularVersions = [13, 14] as const

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
        failCount: 1,
      })

      // Angular uses ZoneJS which encapsulates errors thrown by components
      // Thus, the mount, sync, and async error case errors will not propagate to Cypress
      // and thus won't fail the tests

      verify('command failure', {
        line: 21,
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
