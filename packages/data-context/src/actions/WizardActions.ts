import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import { detectFramework, commandsFileBody, supportFileComponent, supportFileE2E, getBundler, CT_FRAMEWORKS, resolveComponentFrameworkDefinition, detectThirdPartyCTFrameworks } from '@packages/scaffold-config'
import assert from 'assert'
import path from 'path'
import Debug from 'debug'
import fs from 'fs-extra'

const debug = Debug('cypress:data-context:wizard-actions')

import type { DataContext } from '..'
import { addTestingTypeToCypressConfig, AddTestingTypeToCypressConfigOptions } from '@packages/config'
import componentIndexHtmlGenerator from '@packages/scaffold-config/src/component-index-template'

export class WizardActions {
  constructor (private ctx: DataContext) {}

  private get projectRoot () {
    assert(this.ctx.currentProject)

    return this.ctx.currentProject
  }

  setFramework (framework: Cypress.ResolvedComponentFrameworkDefinition | null): void {
    const next = this.ctx.coreData.wizard.frameworks.find((x) => x.type === framework?.type)

    this.ctx.update((coreData) => {
      coreData.wizard.chosenFramework = framework
    })

    if (next?.supportedBundlers?.[0] && next.supportedBundlers.length === 1) {
      this.setBundler(next?.supportedBundlers?.[0])

      return
    }

    const { chosenBundler } = this.ctx.coreData.wizard

    // if the previous bundler was incompatible with the
    // new framework that was selected, we need to reset it
    const doesNotSupportChosenBundler = (chosenBundler && !new Set(
      this.ctx.coreData.wizard.chosenFramework?.supportedBundlers ?? [],
    ).has(chosenBundler.type)) ?? false

    const prevFramework = this.ctx.coreData.wizard.chosenFramework?.type ?? null

    if (!prevFramework || doesNotSupportChosenBundler || !['react', 'vue'].includes(prevFramework)) {
      this.setBundler(null)
    }
  }

  getNullableBundler (bundler: 'vite' | 'webpack' | null) {
    if (!bundler) {
      return null
    }

    try {
      return getBundler(bundler)
    } catch (e) {
      return null
    }
  }

  setBundler (bundler: 'vite' | 'webpack' | null) {
    this.ctx.update((coreData) => {
      coreData.wizard.chosenBundler = this.getNullableBundler(bundler)
    })

    return this.ctx.coreData.wizard
  }

  async completeSetup () {
    debug('completeSetup')
    this.ctx.update((d) => {
      d.scaffoldedFiles = null
    })

    await this.ctx.lifecycleManager.refreshLifecycle()
  }

  /// reset wizard status, useful for when changing to a new project
  resetWizard () {
    this.ctx.update((coreData) => {
      coreData.wizard.chosenBundler = null
      coreData.wizard.chosenFramework = null
      coreData.wizard.detectedBundler = null
      coreData.wizard.detectedFramework = null
    })

    return this.ctx.coreData.wizard
  }

  async initialize () {
    if (!this.ctx.currentProject) {
      return
    }

    this.resetWizard()

    await this.initializeFramework()
  }

  async initializeFramework () {
    if (!this.ctx.currentProject) {
      return
    }

    const detected = await detectFramework(this.ctx.currentProject, this.ctx.coreData.wizard.frameworks)

    debug('detected %o', detected)

    if (detected) {
      this.ctx.update((coreData) => {
        coreData.wizard.detectedFramework = detected.framework ?? null
        coreData.wizard.chosenFramework = detected.framework ?? null

        if (!detected.framework?.supportedBundlers[0]) {
          return
        }

        coreData.wizard.detectedBundler = this.getNullableBundler(detected.bundler || detected.framework.supportedBundlers[0])
        coreData.wizard.chosenBundler = this.getNullableBundler(detected.bundler || detected.framework.supportedBundlers[0])
      })

      this.ctx.emitter.frameworkDetectionChange()
    }
  }

  /**
   * Scaffolds the testing type, by creating the necessary files & assigning to
   */
  async scaffoldTestingType () {
    const { currentTestingType } = this.ctx.coreData

    assert(currentTestingType && 'currentTestingType is required')

    switch (currentTestingType) {
      case 'e2e': {
        const scaffoldedFiles = await this.scaffoldE2E()

        this.ctx.update((d) => {
          d.scaffoldedFiles = scaffoldedFiles
        })

        this.ctx.lifecycleManager.refreshMetaState()
        this.ctx.actions.project.setForceReconfigureProjectByTestingType({ forceReconfigureProject: false, testingType: 'e2e' })

        return
      }
      case 'component': {
        const { chosenBundler, chosenFramework } = this.ctx.coreData.wizard

        assert(chosenBundler && chosenFramework, 'chosenBundler & chosenFramework are required')

        const scaffoldedFiles = await this.scaffoldComponent()

        this.ctx.update((d) => {
          d.scaffoldedFiles = scaffoldedFiles
        })

        this.ctx.lifecycleManager.refreshMetaState()
        this.ctx.actions.project.setForceReconfigureProjectByTestingType({ forceReconfigureProject: false, testingType: 'component' })

        return
      }
      default:
        throw new Error('Unreachable')
    }
  }

  async detectFrameworks () {
    if (!this.ctx.currentProject) {
      return
    }

    const officialFrameworks = CT_FRAMEWORKS.map((framework) => resolveComponentFrameworkDefinition(framework))
    const { frameworks: thirdParty, erroredFrameworks } = await detectThirdPartyCTFrameworks(this.ctx.currentProject)
    const resolvedThirdPartyFrameworks = thirdParty.map(resolveComponentFrameworkDefinition)

    debug('errored third party frameworks %o', erroredFrameworks)

    this.ctx.update((d) => {
      d.wizard.frameworks = officialFrameworks.concat(resolvedThirdPartyFrameworks)
      d.wizard.erroredFrameworks = erroredFrameworks
    })
  }

  private async scaffoldE2E () {
    // Order of the scaffoldedFiles is intentional, confirm before changing
    const scaffoldedFiles = await Promise.all([
      this.scaffoldConfig('e2e'),
      this.scaffoldSupport('e2e', this.ctx.lifecycleManager.fileExtensionToUse),
      this.scaffoldSupport('commands', this.ctx.lifecycleManager.fileExtensionToUse),
      this.scaffoldFixtures(),
    ])

    return scaffoldedFiles
  }

  private async scaffoldComponent () {
    debug('scaffoldComponent')
    const { chosenBundler, chosenFramework } = this.ctx.coreData.wizard

    assert(chosenFramework && chosenBundler)

    // Order of the scaffoldedFiles is intentional, confirm before changing
    const scaffoldedFiles = await Promise.all([
      this.scaffoldConfig('component'),
      this.scaffoldSupport('component', this.ctx.lifecycleManager.fileExtensionToUse),
      this.scaffoldSupport('commands', this.ctx.lifecycleManager.fileExtensionToUse),
      this.scaffoldComponentIndexHtml(chosenFramework),
      this.scaffoldFixtures(),
    ])

    return scaffoldedFiles
  }

  private async scaffoldSupport (fileName: 'e2e' | 'component' | 'commands', language: 'js' | 'ts'): Promise<NexusGenObjects['ScaffoldedFile']> {
    const supportFile = path.join(this.projectRoot, `cypress/support/${fileName}.${language}`)
    const supportDir = path.dirname(supportFile)

    // @ts-ignore
    await this.ctx.fs.mkdir(supportDir, { recursive: true })

    let fileContent: string | undefined
    let description: string = ''

    if (fileName === 'commands') {
      fileContent = commandsFileBody(language)
      description = 'A support file that is useful for creating custom Cypress commands and overwriting existing ones.'
    } else if (fileName === 'e2e') {
      fileContent = supportFileE2E(language)
      description = 'The support file that is bundled and loaded before each E2E spec.'
    } else if (fileName === 'component') {
      assert(this.ctx.coreData.wizard.chosenFramework)
      const mountModule = await this.ctx.coreData.wizard.chosenFramework.mountModule(this.projectRoot)

      fileContent = supportFileComponent(language, mountModule)
      description = 'The support file that is bundled and loaded before each component testing spec.'
    }

    assert(fileContent)

    await this.scaffoldFile(supportFile, fileContent, 'Scaffold default support file')

    return {
      status: 'valid',
      description,
      file: {
        absolute: supportFile,
      },
    }
  }

  private async scaffoldConfig (testingType: 'e2e' | 'component'): Promise<NexusGenObjects['ScaffoldedFile']> {
    debug('scaffoldConfig')

    if (!this.ctx.lifecycleManager.metaState.hasValidConfigFile) {
      this.ctx.lifecycleManager.setConfigFilePath(`cypress.config.${this.ctx.lifecycleManager.fileExtensionToUse}`)
    }

    const configFilePath = this.ctx.lifecycleManager.configFilePath
    const testingTypeInfo: AddTestingTypeToCypressConfigOptions['info'] = testingType === 'e2e' ? {
      testingType: 'e2e',
    } : {
      testingType: 'component',
      bundler: this.ctx.coreData.wizard.chosenBundler?.package ?? 'webpack',
      framework: this.ctx.coreData.wizard.chosenFramework?.configFramework,
      specPattern: this.ctx.coreData.wizard.chosenFramework?.specPattern,
    }

    const result = await addTestingTypeToCypressConfig({
      isProjectUsingESModules: this.ctx.lifecycleManager.metaState.isProjectUsingESModules,
      filePath: configFilePath,
      info: testingTypeInfo,
      projectRoot: this.projectRoot,
    })

    const description = (testingType === 'e2e')
      ? 'The Cypress config file for E2E testing.'
      : 'The Cypress config file where the component testing dev server is configured.'

    const descriptions = {
      ADDED: description,
      MERGED: `Added ${testingType} to the Cypress config file.`,
      CHANGES: 'Merge this code with your existing config file.',
    }

    if (result.result === 'ADDED' || result.result === 'MERGED') {
      return {
        status: 'valid',
        description: descriptions[result.result],
        file: {
          absolute: configFilePath,
          contents: await fs.readFile(configFilePath, 'utf8'),
        },
      }
    }

    return {
      status: 'changes',
      description: descriptions.CHANGES,
      file: {
        absolute: this.ctx.lifecycleManager.configFilePath,
        contents: result.codeToMerge ?? '',
      },
    }
  }

  private async scaffoldFixtures (): Promise<NexusGenObjects['ScaffoldedFile']> {
    const exampleScaffoldPath = path.join(this.projectRoot, 'cypress/fixtures/example.json')

    try {
      const fixturesPath = path.join(this.projectRoot, 'cypress/fixtures')

      await this.ctx.fs.stat(fixturesPath)

      return {
        status: 'skipped',
        description: 'An example fixture for data imported into your Cypress tests, such as `cy.intercept()`.',
        file: {
          absolute: exampleScaffoldPath,
          contents: '// Skipped',
        },
      }
    } catch {
      await this.ensureDir('fixtures')

      return this.scaffoldFile(exampleScaffoldPath,
        `${JSON.stringify(FIXTURE_DATA, null, 2)}\n`,
        'Added an example fixtures file/folder')
    }
  }

  private async scaffoldComponentIndexHtml (chosenFramework: Cypress.ResolvedComponentFrameworkDefinition): Promise<NexusGenObjects['ScaffoldedFile']> {
    const componentIndexHtmlPath = path.join(this.projectRoot, 'cypress', 'support', 'component-index.html')

    await this.ensureDir('support')

    const defaultComponentIndex = componentIndexHtmlGenerator()

    return this.scaffoldFile(
      componentIndexHtmlPath,
      chosenFramework.componentIndexHtml?.() ?? defaultComponentIndex(),
      'The HTML wrapper that each component is served with. Used for global fonts, CSS, JS, HTML, etc.',
    )
  }

  private async scaffoldFile (filePath: string, contents: string, description: string): Promise<NexusGenObjects['ScaffoldedFile']> {
    try {
      debug('scaffoldFile: start %s', filePath)
      debug('scaffoldFile: with content', contents)
      await this.ctx.fs.writeFile(filePath, contents, { flag: 'wx' })
      debug('scaffoldFile: done %s', filePath)

      return {
        status: 'valid',
        description,
        file: {
          absolute: filePath,
        },
      }
    } catch (e: any) {
      if (e.code === 'EEXIST') {
        return {
          status: 'skipped',
          description: 'File already exists',
          file: {
            absolute: filePath,
          },
        }
      }

      return {
        status: 'error',
        description: e.message || 'Error writing file',
        file: {
          absolute: filePath,
          contents,
        },
      }
    }
  }

  private ensureDir (type: 'e2e' | 'fixtures' | 'support') {
    return this.ctx.fs.ensureDir(path.join(this.projectRoot, 'cypress', type))
  }
}

const FIXTURE_DATA = {
  'name': 'Using fixtures to represent data',
  'email': 'hello@cypress.io',
  'body': 'Fixtures are a great way to mock data for responses to routes',
}
