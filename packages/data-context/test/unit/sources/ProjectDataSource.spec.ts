import { expect } from 'chai'
import { matchedSpecs, transformSpec, SpecWithRelativeRoot, BrowserApiShape } from '../../../src/sources'
import path from 'path'
import { DataContext } from '../../../src'
import { graphqlSchema } from '@packages/graphql/src/schema'
import { AppApiShape, AuthApiShape, ElectronApiShape, LocalSettingsApiShape, ProjectApiShape } from '../../../src/actions'
import { InjectedConfigApi } from '../../../src/data'

describe('matchedSpecs', () => {
  context('got a single spec pattern from --spec via cli', () => {
    it('returns spec name only', () => {
      const result = matchedSpecs({
        projectRoot: '/var/folders/T/cy-projects/e2e',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/var/folders/T/cy-projects/e2e/cypress/integration/screenshot_element_capture_spec.js',
        ],
        specPattern: '/var/folders/T/cy-projects/e2e/cypress/integration/screenshot_element_capture_spec.js',
      })

      const actual: SpecWithRelativeRoot[] = [{
        absolute: '/var/folders/T/cy-projects/e2e/cypress/integration/screenshot_element_capture_spec.js',
        baseName: 'screenshot_element_capture_spec.js',
        fileExtension: '.js',
        fileName: 'screenshot_element_capture_spec',
        name: 'cypress/integration/screenshot_element_capture_spec.js',
        relative: 'cypress/integration/screenshot_element_capture_spec.js',
        relativeToCommonRoot: 'screenshot_element_capture_spec.js',
        specFileExtension: '.js',
        specType: 'integration',
      }]

      expect(result).to.eql(actual)
    })
  })

  context('got a multi spec pattern from --spec via cli', () => {
    it('removes all common path', () => {
      const result = matchedSpecs({
        projectRoot: '/var/folders/T/cy-projects/e2e',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_passing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_hooks_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_hook_spec.js',
        ],
        specPattern: [
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_passing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_hooks_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_spec.js',
          '/var/folders/T/cy-projects/e2e/cypress/integration/simple_failing_h*_spec.js',
        ],
      })

      expect(result[0].relativeToCommonRoot).to.eq('simple_passing_spec.js')
      expect(result[1].relativeToCommonRoot).to.eq('simple_hooks_spec.js')
      expect(result[2].relativeToCommonRoot).to.eq('simple_failing_spec.js')
      expect(result[3].relativeToCommonRoot).to.eq('simple_failing_hook_spec.js')
    })
  })

  context('generic glob from config', () => {
    it('infers common path from glob and returns spec name', () => {
      const result = matchedSpecs({
        projectRoot: '/Users/lachlan/code/work/cypress6/packages/app',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/Users/lachlan/code/work/cypress6/packages/app/cypress/e2e/integration/files.spec.ts',
          '/Users/lachlan/code/work/cypress6/packages/app/cypress/e2e/integration/index.spec.ts',
        ],
        specPattern: 'cypress/e2e/integration/**/*.spec.ts',
      })

      expect(result[0].relativeToCommonRoot).to.eq('files.spec.ts')
      expect(result[1].relativeToCommonRoot).to.eq('index.spec.ts')
    })
  })

  context('deeply nested test', () => {
    it('removes superfluous leading directories', () => {
      const result = matchedSpecs({
        projectRoot: '/var/folders/y5/T/cy-projects/e2e',
        testingType: 'e2e',
        specAbsolutePaths: [
          '/var/folders/y5/T/cy-projects/e2e/cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.js',
        ],
        specPattern: '/var/folders/y5/T/cy-projects/e2e/cypress/integration/nested-1/nested-2/screenshot_nested_file_spec.js',
      })

      expect(result[0].relativeToCommonRoot).to.eq('screenshot_nested_file_spec.js')
    })
  })
})

describe('transformSpec', () => {
  it('handles backslashes by normalizing to posix, eg win32', () => {
    const result = transformSpec({
      projectRoot: 'C:\\Windows\\Project',
      testingType: 'e2e',
      absolute: 'C:\\Windows\\Project\\src\\spec.cy.js',
      commonRoot: 'C:\\Windows\\Project\\src',
      platform: 'win32',
      sep: '\\',
    })

    const actual: SpecWithRelativeRoot = {
      absolute: 'C:/Windows/Project/src/spec.cy.js',
      specFileExtension: '.cy.js',
      fileExtension: '.js',
      specType: 'integration',
      baseName: 'spec.cy.js',
      fileName: 'spec',
      relative: 'src/spec.cy.js',
      name: 'src/spec.cy.js',
      relativeToCommonRoot: 'C:/Windows/Project/src/spec.cy.js',
    }

    expect(result).to.eql(actual)
  })
})

describe('findSpecs', () => {
  const temporary = 'tmp'

  const fixture = [
    'node_modules/test/App.spec.js',
    'packages/node_modules/folder/App.spec.js',
    'component/App.spec.ts',
    'component/App.cy.ts',
    'component/App.cy.js',
    'e2e/onboarding.spec.ts',
    'e2e/onboarding.cy.ts',
    'e2e/onboarding.cy.js',
  ]

  let ctx: DataContext

  beforeEach(async () => {
    ctx = new DataContext({
      schema: graphqlSchema,
      mode: 'run',
      modeOptions: {},
      appApi: {} as AppApiShape,
      localSettingsApi: {} as LocalSettingsApiShape,
      authApi: {} as AuthApiShape,
      configApi: {
        getServerPluginHandlers: () => [],
      } as InjectedConfigApi,
      projectApi: {} as ProjectApiShape,
      electronApi: {} as ElectronApiShape,
      browserApi: {} as BrowserApiShape,
    })

    await Promise.all(fixture.map((element) => ctx.fs.outputFile(path.join(temporary, element), '')))
  })

  afterEach(async () => {
    await ctx.fs.remove(temporary)
  })

  it('find all the *.cy.{ts,js} excluding the e2e', async () => {
    const specs = await ctx.project.findSpecs(temporary, 'component', ['**/*.cy.{ts,js}'], ['e2e/*.{spec,cy}.{ts,js}'], [])

    expect(specs).to.have.length(2)
  })

  it('find all the *.{cy,spec}.{ts,js} excluding the e2e', async () => {
    const specs = await ctx.project.findSpecs(temporary, 'component', ['**/*.{cy,spec}.{ts,js}'], ['e2e/*.{spec,cy}.{ts,js}'], [])

    expect(specs).to.have.length(3)
  })

  it('find all the e2e specs', async () => {
    const specs = await ctx.project.findSpecs(temporary, 'e2e', ['e2e/*.{cy,spec}.{ts,js}'], [], [])

    expect(specs).to.have.length(3)
  })

  it('ignores node_modules if excludeSpecPattern is empty array', async () => {
    const specs = await ctx.project.findSpecs(temporary, 'component', ['**/*.{cy,spec}.{ts,js}'], [], [])

    expect(specs).to.have.length(6)
  })

  it('ignores e2e tests if globToRemove is set', async () => {
    const specs = await ctx.project.findSpecs(temporary, 'component', ['**/*.{cy,spec}.{ts,js}'], [], ['e2e/*.{spec,cy}.{ts,js}'])

    expect(specs).to.have.length(3)
  })
})
