import chai from 'chai'
import os from 'os'
import fs from 'fs-extra'

import { matchedSpecs, transformSpec, SpecWithRelativeRoot, getLongestCommonPrefixFromPaths, getPathFromSpecPattern } from '../../../src/sources'
import path from 'path'
import sinon from 'sinon'
import chokidar from 'chokidar'
import _ from 'lodash'
import sinonChai from 'sinon-chai'
import { FoundSpec } from '@packages/types'
import { DataContext } from '../../../src'
import type { FindSpecs } from '../../../src/actions'
import { createTestDataContext } from '../helper'
import { defaultExcludeSpecPattern, defaultSpecPattern } from '@packages/config'
import FixturesHelper from '@tooling/system-tests'

chai.use(sinonChai)
const { expect } = chai

function delay (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

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
  const projectRoot = path.join(os.tmpdir(), 'findSpecs')

  const fixture = [
    'node_modules/test/App.spec.js',
    'packages/node_modules/folder/App.spec.js',
    'component/App.spec.ts',
    'component/App.cy.ts',
    'component/App.cy.js',
    'e2e/onboarding.spec.ts',
    'e2e/onboarding.cy.ts',
    'e2e/onboarding.cy.js',
    'e2e/onboarding.cy.js.mp4',
  ]

  let ctx: DataContext

  beforeEach(async () => {
    await fs.remove(projectRoot)
    ctx = createTestDataContext('run')
    await ctx.fs.ensureDir(projectRoot)
    await Promise.all(fixture.map((element) => ctx.fs.outputFile(path.join(projectRoot, element), '')))
  })

  afterEach(async () => {
    await ctx.fs.remove(projectRoot)
  })

  it('excludes specs outside `specPattern`, even if passing a generic glob', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'e2e',
      specPattern: ['**/onboarding*'],
      configSpecPattern: ['e2e/*.{spec,cy}.{ts,js}'],
      excludeSpecPattern: [],
      additionalIgnorePattern: [],
    })

    expect(specs).to.have.length(3)
  })

  it('find all the *.cy.{ts,js} excluding the e2e', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'component',
      specPattern: ['**/*.cy.{ts,js}'],
      configSpecPattern: ['**/*.cy.{ts,js}'],
      excludeSpecPattern: [],
      additionalIgnorePattern: ['e2e/*.{spec,cy}.{ts,js}'],
    })

    expect(specs).to.have.length(2)
  })

  it('find all the *.{cy,spec}.{ts,js} excluding the e2e', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'component',
      specPattern: ['**/*.{cy,spec}.{ts,js}'],
      configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
      excludeSpecPattern: [],
      additionalIgnorePattern: ['e2e/*.{spec,cy}.{ts,js}'],
    })

    expect(specs).to.have.length(3)
  })

  it('find all the e2e specs', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'e2e',
      specPattern: ['e2e/*.{cy,spec}.{ts,js}'],
      configSpecPattern: ['e2e/*.{cy,spec}.{ts,js}'],
      excludeSpecPattern: [],
      additionalIgnorePattern: [],
    })

    expect(specs).to.have.length(3)
  })

  it('ignores node_modules if excludeSpecPattern is empty array', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'component',
      specPattern: ['**/*.{cy,spec}.{ts,js}'],
      configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
      excludeSpecPattern: [],
      additionalIgnorePattern: [],
    })

    expect(specs).to.have.length(6)
  })

  it('ignores e2e tests if additionalIgnorePattern is set', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'component',
      specPattern: ['**/*.{cy,spec}.{ts,js}'],
      configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
      additionalIgnorePattern: ['e2e/*.{spec,cy}.{ts,js}'],
      excludeSpecPattern: [],
    })

    expect(specs).to.have.length(3)
  })

  it('respects excludeSpecPattern', async () => {
    const specs = await ctx.project.findSpecs({
      projectRoot,
      testingType: 'component',
      specPattern: ['**/*.{cy,spec}.{ts,js}'],
      configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
      additionalIgnorePattern: ['e2e/*.{spec,cy}.{ts,js}'],
      excludeSpecPattern: ['**/*'],
    })

    expect(specs).to.have.length(0)
  })
})

describe('getLongestCommonPrefixFromPaths', () => {
  it('with cypress', () => {
    const lcp = getLongestCommonPrefixFromPaths([
      'cypress/component/foo/meta-component-test.cy.ts',
      'cypress/component/bar/meta-component-test.cy.ts',
    ])

    expect(lcp).to.equal('cypress/component')
  })

  it('with src and cypress', () => {
    const lcp = getLongestCommonPrefixFromPaths([
      'cypress/component/foo/meta-component-test.cy.ts',
      'cypress/component/bar/meta-component-test.cy.ts',
      'src/frontend/MyComponent.cy.ts',
    ])

    expect(lcp).to.equal('')
  })

  it('with src', () => {
    const lcp = getLongestCommonPrefixFromPaths([
      'src/frontend/MyComponent.cy.ts',
      'src/MyComponent.cy.ts',
    ])

    expect(lcp).to.equal('src')
  })

  it('with 1 path', () => {
    const lcp = getLongestCommonPrefixFromPaths([
      'src/frontend/MyComponent.cy.ts',
    ])

    expect(lcp).to.equal('src/frontend')
  })
})

describe('getPathFromSpecPattern', () => {
  context('dirname', () => {
    it('returns pattern without change if it is do not a glob', () => {
      const specPattern = 'cypress/e2e/foo.spec.ts'
      const defaultFileName = getPathFromSpecPattern({ specPattern, testingType: 'e2e' })

      expect(defaultFileName).to.eq(specPattern)
    })

    it('remove ** from glob if it is not in the beginning', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/**/foo.spec.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/foo.spec.ts')
    })

    it('replace ** for cypress if it starts with **', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: '**/e2e/foo.spec.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/e2e/foo.spec.ts')
    })

    it('replace ** for cypress if it starts with ** and omit extra **', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: '**/**/foo.spec.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/foo.spec.ts')
    })

    it('selects first option if there are multiples possibilities of values', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: '{cypress,tests}/{integration,e2e}/foo.spec.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/integration/foo.spec.ts')
    })
  })

  context('filename', () => {
    it('replace * for filename', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/*.spec.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/e2e/spec.spec.ts')
    })

    it('selects first option if there are multiples possibilities of values', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/{foo,filename}.spec.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/e2e/foo.spec.ts')
    })
  })

  context('test extension', () => {
    it('replace * for filename', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/filename.*.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/e2e/filename.cy.ts')
    })

    it('selects first option if there are multiples possibilities of values', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/filename.{spec,cy}.ts', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/e2e/filename.spec.ts')
    })
  })

  context('lang extension', () => {
    it('if project use TS, set TS as extension if it exists in the glob', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/filename.cy.ts', testingType: 'e2e', fileExtensionToUse: 'ts' })

      expect(defaultFileName).to.eq('cypress/e2e/filename.cy.ts')
    })

    it('if project use TS, set TS as extension if it exists in the options of extensions', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/filename.cy.{js,ts,tsx}', testingType: 'e2e', fileExtensionToUse: 'ts' })

      expect(defaultFileName).to.eq('cypress/e2e/filename.cy.ts')
    })

    it('if project use TS, do not set TS as extension if it do not exists in the options of extensions', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/filename.cy.{js,jsx}', testingType: 'e2e', fileExtensionToUse: 'ts' })

      expect(defaultFileName).to.eq('cypress/e2e/filename.cy.js')
    })

    it('selects first option if there are multiples possibilities of values', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/e2e/filename.cy.{ts,js}', testingType: 'e2e' })

      expect(defaultFileName).to.eq('cypress/e2e/filename.cy.ts')
    })
  })

  context('extra cases', () => {
    it('creates specName for tests/*.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'tests/*.js', testingType: 'e2e' })

      expect(defaultFileName).to.eq('tests/spec.js')
    })

    it('creates specName for src/*-test.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'src/*-test.js', testingType: 'e2e' })

      expect(defaultFileName).to.eq('src/spec-test.js')
    })

    it('creates specName for src/*.foo.bar.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'src/*.foo.bar.js', testingType: 'e2e' })

      expect(defaultFileName).to.eq('src/spec.foo.bar.js')
    })

    it('creates specName for src/prefix.*.test.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'src/prefix.*.test.js', testingType: 'e2e' })

      expect(defaultFileName).to.eq('src/prefix.cy.test.js')
    })

    it('creates specName for src/*/*.test.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'src/*/*.test.js', testingType: 'e2e' })

      expect(defaultFileName).to.eq('src/e2e/spec.test.js')
    })

    it('creates specName for src-*/**/*.test.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'src-*/**/*.test.js', testingType: 'e2e' })

      expect(defaultFileName).to.eq('src-e2e/spec.test.js')
    })

    it('creates specName for src/*.test.(js|jsx)', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'src/*.test.(js|jsx)', testingType: 'component' })

      const possiblesFileNames = ['src/ComponentName.test.jsx', 'src/ComponentName.test.js']

      expect(possiblesFileNames.includes(defaultFileName)).to.eq(true)
    })

    it('creates specName for (src|components)/**/*.test.js', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: '(src|components)/**/*.test.js', testingType: 'component' })

      const possiblesFileNames = ['src/ComponentName.test.js', 'components/ComponentName.test.js']

      expect(possiblesFileNames.includes(defaultFileName)).to.eq(true)
    })

    it('creates specName for e2e/**/*.cy.{js,jsx,ts,tsx}', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'e2e/**/*.cy.{js,jsx,ts,tsx}', testingType: 'e2e' })

      expect(defaultFileName).to.eq('e2e/spec.cy.js')
    })

    it('creates specName for cypress/component-tests/**/*', () => {
      const defaultFileName = getPathFromSpecPattern({ specPattern: 'cypress/component-tests/**/*', testingType: 'component', fileExtensionToUse: 'ts' })

      expect(defaultFileName).to.eq('cypress/component-tests/ComponentName.cy.ts')
    })
  })
})

describe('_makeSpecWatcher', () => {
  let ctx: DataContext
  let specWatcher: chokidar.FSWatcher

  beforeEach(async function () {
    this.timeout(20000) // fixture cleanup can take awhile
    FixturesHelper.remove()

    this.specWatcherPath = await FixturesHelper.scaffoldProject('spec-watcher')

    ctx = createTestDataContext('open', { projectRoot: this.specWatcherPath })
  })

  afterEach(async () => {
    sinon.restore()
    await specWatcher.close()
    ctx.destroy()
  })

  const SUPPORT_FILE = path.join('cypress', 'support', 'e2e.js')
  const SPEC_FILE1 = path.join('cypress', 'e2e', 'foo.cy.js')
  const SPEC_FILE2 = path.join('cypress', 'e2e', 'some', 'new', 'folder', 'foo.cy.js')
  const SPEC_FILE3 = path.join('cypress', 'e2e', 'some', 'new', 'folder', 'foo.spec.ts')
  const SPEC_FILE_ABC = path.join('cypress', 'e2e', 'some', 'new', 'folder', 'abc.ts')

  const writeFiles = () => {
    return Promise.all([
      ctx.actions.file.writeFileInProject(SUPPORT_FILE, '// foo'),
      ctx.actions.file.writeFileInProject(SPEC_FILE1, '// foo'),
      ctx.actions.file.writeFileInProject(SPEC_FILE2, '// foo'),
      ctx.actions.file.writeFileInProject(SPEC_FILE3, '// foo'),
      ctx.actions.file.writeFileInProject(SPEC_FILE_ABC, '// foo'),
    ])
  }

  it('watch for changes on files based on the specPattern', async function () {
    specWatcher = ctx.project._makeSpecWatcher({
      projectRoot: this.specWatcherPath,
      specPattern: ['**/*.{cy,spec}.{ts,js}'],
      excludeSpecPattern: ['**/ignore.spec.ts'],
      additionalIgnorePattern: ['additional.ignore.cy.js'],
    })

    await new Promise((resolve) => specWatcher.once('ready', resolve))

    const allFiles = new Set()

    specWatcher.on('add', (filePath) => allFiles.add(filePath))
    specWatcher.on('change', (filePath) => allFiles.add(filePath))

    await writeFiles()

    let attempt = 0

    while (allFiles.size < 3 && attempt++ <= 100) {
      await delay(10)
    }

    expect(Array.from(allFiles).sort()).to.eql([
      SPEC_FILE1,
      SPEC_FILE2,
      SPEC_FILE3,
    ])

    expect(Array.from(allFiles)).to.not.include(SUPPORT_FILE)
  })

  it('watch for changes on files with multiple specPatterns', async function () {
    specWatcher = ctx.project._makeSpecWatcher({
      projectRoot: this.specWatcherPath,
      specPattern: ['**/*.{cy,spec}.{ts,js}', '**/abc.ts'],
      excludeSpecPattern: ['**/ignore.spec.ts'],
      additionalIgnorePattern: ['additional.ignore.cy.js'],
    })

    await new Promise((resolve) => specWatcher.on('ready', resolve))

    const allFiles = new Set()

    specWatcher.on('add', (filePath) => allFiles.add(filePath))
    specWatcher.on('change', (filePath) => allFiles.add(filePath))

    await writeFiles()

    let attempt = 0

    while (allFiles.size < 3 && attempt++ <= 100) {
      await delay(10)
    }

    expect(Array.from(allFiles).sort()).to.eql([
      SPEC_FILE1,
      SPEC_FILE_ABC,
      SPEC_FILE2,
      SPEC_FILE3,
    ])

    expect(Array.from(allFiles)).to.not.include(SUPPORT_FILE)
  })

  it('do not throw if file/folder is deleted while ignoring files', async function () {
    specWatcher = ctx.project._makeSpecWatcher({
      projectRoot: this.specWatcherPath,
      specPattern: ['**/*.{cy,spec}.{ts,js}', '**/abc.ts'],
      excludeSpecPattern: ['**/ignore.spec.ts'],
      additionalIgnorePattern: ['additional.ignore.cy.js'],
    })

    await new Promise((resolve) => specWatcher.on('ready', resolve))

    const allFiles = new Set()

    specWatcher.on('add', (filePath) => allFiles.add(filePath))
    specWatcher.on('change', (filePath) => allFiles.add(filePath))
    specWatcher.on('unlink', (filePath) => allFiles.delete(filePath))

    await writeFiles()
    await ctx.actions.file.removeFileInProject(SPEC_FILE1)
    await delay(1000)

    expect(Array.from(allFiles).sort()).to.eql([
      SPEC_FILE_ABC,
      SPEC_FILE2,
      SPEC_FILE3,
    ])

    expect(Array.from(allFiles)).to.not.include(SPEC_FILE1)
    expect(Array.from(allFiles)).to.not.include(SUPPORT_FILE)
  })
})

describe('startSpecWatcher', () => {
  const projectRoot = 'tmp'

  let ctx: DataContext

  afterEach(async () => {
    sinon.restore()
  })

  describe('run mode', () => {
    beforeEach(async () => {
      ctx = createTestDataContext('run')

      ctx.coreData.currentProject = projectRoot
    })

    it('early return specWatcher', () => {
      const onStub = sinon.stub()

      sinon.stub(chokidar, 'watch').callsFake(() => {
        const mockWatcher = {
          on: onStub,
          close: () => ({ catch: () => {} }),
        } as unknown

        return mockWatcher as chokidar.FSWatcher
      })

      let handleFsChange

      sinon.stub(_, 'debounce').callsFake((funcToDebounce) => {
        handleFsChange = (() => funcToDebounce())

        return handleFsChange as _.DebouncedFunc<any>
      })

      ctx.project.startSpecWatcher({
        projectRoot,
        testingType: 'e2e',
        specPattern: ['**/*.{cy,spec}.{ts,js}'],
        configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
        excludeSpecPattern: ['**/ignore.spec.ts'],
        additionalIgnorePattern: ['additional.ignore.cy.js'],
      })

      expect(_.debounce).to.have.not.been.called

      expect(chokidar.watch).to.have.not.been.called

      expect(onStub).to.have.not.been.called
    })
  })

  describe('open mode', () => {
    beforeEach(() => {
      ctx = createTestDataContext('open')

      ctx.coreData.currentProject = projectRoot
    })

    it('throws if no current project defined', async () => {
      ctx.coreData.currentProject = null

      try {
        await ctx.project.startSpecWatcher({
          projectRoot,
          testingType: 'e2e',
          specPattern: ['**/*.{cy,spec}.{ts,js}'],
          configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
          excludeSpecPattern: ['**/ignore.spec.ts'],
          additionalIgnorePattern: [],
        })
      } catch (error) {
        return
      }

      throw new Error('Should have thrown error')
    })

    it('creates file watcher based on given config properties', async () => {
      const onStub = sinon.stub()

      sinon.stub(chokidar, 'watch').callsFake(() => {
        const mockWatcher = {
          on: onStub,
          close: () => ({ catch: () => {} }),
        } as unknown

        return mockWatcher as chokidar.FSWatcher
      })

      let handleFsChange

      sinon.stub(_, 'debounce').callsFake((funcToDebounce) => {
        handleFsChange = (() => funcToDebounce())

        return handleFsChange as _.DebouncedFunc<any>
      })

      await ctx.project.startSpecWatcher({
        projectRoot,
        testingType: 'e2e',
        specPattern: ['**/*.{cy,spec}.{ts,js}'],
        configSpecPattern: ['**/*.{cy,spec}.{ts,js}'],
        excludeSpecPattern: ['**/ignore.spec.ts'],
        additionalIgnorePattern: ['additional.ignore.cy.js'],
      })

      expect(_.debounce).to.have.been.calledWith(sinon.match.func, 250)

      expect(chokidar.watch).to.have.been.calledWith('.', {
        ignoreInitial: true,
        cwd: projectRoot,
        ignored: ['**/node_modules/**', '**/ignore.spec.ts', 'additional.ignore.cy.js', sinon.match.func],
        ignorePermissionErrors: true,
      })

      expect(onStub).to.have.been.calledWith('all', handleFsChange)
    })

    it('implements change handler with duplicate result handling', async () => {
      const mockFoundSpecs = [
        { name: 'test-1.cy.js' },
        { name: 'test-2.cy.js' },
        { name: 'test-3.cy.js' },
      ] as FoundSpec[]

      sinon.stub(ctx.project, 'findSpecs').resolves(mockFoundSpecs)
      sinon.stub(ctx.actions.project, 'setSpecs')

      sinon.stub(chokidar, 'watch').callsFake(() => {
        const mockWatcher = {
          on: () => {},
          close: () => ({ catch: () => {} }),
        } as unknown

        return mockWatcher as chokidar.FSWatcher
      })

      let handleFsChange

      sinon.stub(_, 'debounce').callsFake((funcToDebounce) => {
        handleFsChange = (() => funcToDebounce())

        return handleFsChange as _.DebouncedFunc<any>
      })

      const watchOptions: FindSpecs<string[]> = {
        projectRoot,
        testingType: 'e2e',
        specPattern: ['**/*.{cy,spec}.{ts,js}'],
        configSpecPattern: ['**/ignore.spec.ts'],
        excludeSpecPattern: ['additional.ignore.cy.js'],
        additionalIgnorePattern: [],
      }

      await ctx.project.startSpecWatcher(watchOptions)

      // Set internal specs state to the stubbed found value to simulate irrelevant FS changes
      ctx.project.setSpecs(mockFoundSpecs)

      await handleFsChange()

      expect(ctx.project.findSpecs).to.have.been.calledWith(watchOptions)
      expect(ctx.actions.project.setSpecs).not.to.have.been.called

      // Update internal specs state so that a change will be detected on next FS event
      const updatedSpecs = [...mockFoundSpecs, { name: 'test-4.cy.js' }] as FoundSpec[]

      ctx.project.setSpecs(updatedSpecs)

      await handleFsChange()

      expect(ctx.project.findSpecs).to.have.been.calledWith(watchOptions)
      expect(ctx.actions.project.setSpecs).to.have.been.calledWith(mockFoundSpecs)
    })
  })
})

describe('ProjectDataSource', () => {
  let ctx: DataContext

  beforeEach(() => {
    ctx = createTestDataContext('run')
    ctx.coreData.currentProject = 'foo-project'
    ctx.coreData.currentTestingType = 'e2e'
  })

  context('#defaultSpecFilename', () => {
    it('yields default if no spec pattern is set', async () => {
      sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: [] })

      const defaultSpecFileName = await ctx.project.defaultSpecFileName()

      expect(defaultSpecFileName).to.equal('cypress/e2e/spec.cy.js')
    })

    it('yields default if the spec pattern is default', async () => {
      sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: [defaultSpecPattern.e2e] })
      const defaultSpecFileName = await ctx.project.defaultSpecFileName()

      expect(defaultSpecFileName).to.equal('cypress/e2e/spec.cy.js')
    })

    it('yields common prefix if there are existing specs', async () => {
      sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: ['cypress/e2e/**/*'] })
      ctx.project.setSpecs([
        { relative: 'cypress/e2e/foo/spec.js' },
        { relative: 'cypress/e2e/foo/bar/spec.js' },
      ] as FoundSpec[])

      const defaultSpecFileName = await ctx.project.defaultSpecFileName()

      expect(defaultSpecFileName).to.equal('cypress/e2e/foo/spec.cy.js')
    })

    it('yields spec pattern guess if there are no existing specs', async () => {
      sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: ['cypress/integration/**/*'] })

      const defaultSpecFileName = await ctx.project.defaultSpecFileName()

      expect(defaultSpecFileName).to.equal('cypress/integration/spec.cy.js')
    })

    it('yields correct filename from specpattern if there are existing specs', async () => {
      ctx.coreData.currentTestingType = 'component'
      sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: ['cypress/component-tests/*.spec.js'] })
      ctx.project.setSpecs([
        { relative: 'cypress/component-tests/foo/spec.spec.js' },
        { relative: 'cypress/component-tests/foo/spec2.spec.js' },
      ] as FoundSpec[])

      const defaultSpecFileName = await ctx.project.defaultSpecFileName()

      expect(defaultSpecFileName).to.equal('cypress/component-tests/foo/ComponentName.spec.js')
    })

    describe('jsx/tsx handling', () => {
      beforeEach(async () => {
        ctx.coreData.currentTestingType = 'component'
        await ctx.actions.file.writeFileInProject(path.join('src', 'components', 'App.jsx'), '// foo')
      })

      it('yields correct jsx extension if there are jsx files and specPattern allows', async () => {
        sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: [defaultSpecPattern.component] })
        sinon.stub(ctx.project, 'specPatternsByTestingType').resolves({ specPattern: [defaultSpecPattern.component] })

        const defaultSpecFileName = await ctx.project.defaultSpecFileName()

        expect(defaultSpecFileName).to.equal('cypress/component/ComponentName.cy.jsx', defaultSpecFileName)
      })

      it('yields non-jsx extension if there are jsx files but specPattern disallows', async () => {
        sinon.stub(ctx.project, 'specPatterns').resolves({ specPattern: ['cypress/component/*.cy.js'] })
        sinon.stub(ctx.project, 'specPatternsByTestingType').resolves({ specPattern: ['cypress/component/*.cy.js'] })

        const defaultSpecFileName = await ctx.project.defaultSpecFileName()

        // specPattern does not allow for jsx, so generated spec name should not use jsx extension
        expect(defaultSpecFileName).to.equal('cypress/component/ComponentName.cy.js', defaultSpecFileName)
      })
    })
  })

  describe('specPatternsByTestingType', () => {
    context('when custom patterns configured', () => {
      beforeEach(() => {
        sinon.stub(ctx.lifecycleManager, 'getConfigFileContents').resolves({
          e2e: {
            specPattern: 'abc',
            excludeSpecPattern: 'def',
          },
          component: {
            specPattern: 'uvw',
            excludeSpecPattern: 'xyz',
          } as any,
        })
      })

      it('should return custom e2e patterns', async () => {
        expect(await ctx.project.specPatternsByTestingType('e2e')).to.eql({
          specPattern: ['abc'],
          excludeSpecPattern: ['def'],
        })
      })

      it('should return custom component patterns', async () => {
        expect(await ctx.project.specPatternsByTestingType('component')).to.eql({
          specPattern: ['uvw'],
          excludeSpecPattern: ['xyz'],
        })
      })
    })

    context('when no custom patterns configured', () => {
      const wrapInArray = (value: string | string[]): string[] => {
        return Array.isArray(value) ? value : [value]
      }

      beforeEach(() => {
        sinon.stub(ctx.lifecycleManager, 'getConfigFileContents').resolves({})
      })

      it('should return default e2e patterns', async () => {
        expect(await ctx.project.specPatternsByTestingType('e2e')).to.eql({
          specPattern: wrapInArray(defaultSpecPattern.e2e),
          excludeSpecPattern: wrapInArray(defaultExcludeSpecPattern.e2e),
        })
      })

      it('should return default component patterns', async () => {
        expect(await ctx.project.specPatternsByTestingType('component')).to.eql({
          specPattern: wrapInArray(defaultSpecPattern.component),
          excludeSpecPattern: wrapInArray(defaultExcludeSpecPattern.component),
        })
      })
    })
  })
})
