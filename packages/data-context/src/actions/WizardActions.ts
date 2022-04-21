import type { CodeLanguageEnum, NexusGenEnums, NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import { detect, WIZARD_FRAMEWORKS, WIZARD_BUNDLERS, commandsFileBody, supportFileComponent, supportFileE2E } from '@packages/scaffold-config'
import assert from 'assert'
import path from 'path'
import Debug from 'debug'
import fs from 'fs-extra'

const debug = Debug('cypress:data-context:wizard-actions')

import type { DataContext } from '..'
import { addTestingTypeToCypressConfig, AddTestingTypeToCypressConfigOptions } from '@packages/config'

export class WizardActions {
  constructor (private ctx: DataContext) {}

  private get projectRoot () {
    assert(this.ctx.currentProject)

    return this.ctx.currentProject
  }

  private get data () {
    return this.ctx.wizardData
  }

  setFramework (framework: typeof WIZARD_FRAMEWORKS[number] | null): void {
    const next = WIZARD_FRAMEWORKS.find((x) => x.type === framework?.type)

    this.ctx.update((coreData) => {
      coreData.wizard.chosenFramework = framework
    })

    if (next?.supportedBundlers?.length === 1) {
      this.setBundler(next?.supportedBundlers?.[0])

      return
    }

    const { chosenBundler } = this.ctx.coreData.wizard

    // if the previous bundler was incompatible with the
    // new framework that was selected, we need to reset it
    const doesNotSupportChosenBundler = (chosenBundler && !new Set(
      this.ctx.coreData.wizard.chosenFramework?.supportedBundlers.map((x) => x.type) || [],
    ).has(chosenBundler.type)) ?? false

    const prevFramework = this.ctx.coreData.wizard.chosenFramework?.type ?? null

    if (!prevFramework || doesNotSupportChosenBundler || !['react', 'vue'].includes(prevFramework)) {
      this.setBundler(null)
    }
  }

  setBundler (bundler: typeof WIZARD_BUNDLERS[number] | null) {
    this.ctx.update((coreData) => {
      coreData.wizard.chosenBundler = bundler
    })

    return this.ctx.coreData.wizard
  }

  setCodeLanguage (lang: NexusGenEnums['CodeLanguageEnum']) {
    this.ctx.update((coreData) => {
      coreData.wizard.chosenLanguage = lang
    })

    return this.ctx.coreData.wizard
  }

  async completeSetup () {
    debug('completeSetup')
    // wait for the config to be initialized if it is not yet
    // before returning. This should not penalize users but
    // allow for tests, too fast for this last step to pass.
    // NOTE: if the config is already initialized, this will be instant
    await this.ctx.lifecycleManager.initializeConfig()
    this.ctx.update((d) => {
      d.scaffoldedFiles = null
    })

    this.ctx.lifecycleManager.loadTestingType()
  }

  /// reset wizard status, useful for when changing to a new project
  resetWizard () {
    this.ctx.update((coreData) => {
      coreData.wizard.chosenBundler = null
      coreData.wizard.chosenFramework = null
      coreData.wizard.chosenLanguage = 'js'
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

    await this.detectLanguage()
    debug('detectedLanguage %s', this.data.detectedLanguage)
    this.data.chosenLanguage = this.data.detectedLanguage || 'js'

    const detected = detect(this.ctx.currentProject)

    debug('detected %o', detected)

    if (detected) {
      this.ctx.update((coreData) => {
        coreData.wizard.detectedFramework = detected.framework ?? null
        coreData.wizard.chosenFramework = detected.framework ?? null

        if (!detected.framework?.supportedBundlers[0]) {
          return
        }

        coreData.wizard.detectedBundler = detected.bundler || detected.framework.supportedBundlers[0]
        coreData.wizard.chosenBundler = detected.bundler || detected.framework.supportedBundlers[0]
      })
    }
  }

  private async detectLanguage () {
    const { hasTypescript } = this.ctx.lifecycleManager.metaState

    if (
      hasTypescript ||
      (this.ctx.lifecycleManager.configFile && /.ts$/.test(this.ctx.lifecycleManager.configFile))) {
      this.ctx.wizardData.detectedLanguage = 'ts'
    } else {
      this.ctx.wizardData.detectedLanguage = 'js'
    }
  }

  /**
   * Scaffolds the testing type, by creating the necessary files & assigning to
   */
  async scaffoldTestingType () {
    const { currentTestingType, wizard: { chosenLanguage } } = this.ctx.coreData

    assert(currentTestingType && chosenLanguage, 'currentTestingType & chosenLanguage are required')

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

  private async scaffoldE2E () {
    const scaffolded = await Promise.all([
      this.scaffoldConfig('e2e'),
      this.scaffoldSupport('e2e', this.ctx.coreData.wizard.chosenLanguage),
      this.scaffoldSupport('commands', this.ctx.coreData.wizard.chosenLanguage),
      this.scaffoldFixtures(),
    ])

    return scaffolded
  }

  private async scaffoldComponent () {
    debug('scaffoldComponent')
    const { chosenBundler, chosenFramework, chosenLanguage } = this.ctx.coreData.wizard

    assert(chosenFramework && chosenLanguage && chosenBundler)

    return await Promise.all([
      this.scaffoldConfig('component'),
      this.scaffoldFixtures(),
      this.scaffoldSupport('component', chosenLanguage),
      this.scaffoldSupport('commands', chosenLanguage),
      this.scaffoldComponentIndexHtml(chosenFramework),
    ])
  }

  private async scaffoldSupport (fileName: 'e2e' | 'component' | 'commands', language: CodeLanguageEnum): Promise<NexusGenObjects['ScaffoldedFile']> {
    const supportFile = path.join(this.projectRoot, `cypress/support/${fileName}.${language}`)
    const supportDir = path.dirname(supportFile)

    // @ts-ignore
    await this.ctx.fs.mkdir(supportDir, { recursive: true })

    let fileContent: string | undefined

    if (fileName === 'commands') {
      fileContent = commandsFileBody(language)
    } else if (fileName === 'e2e') {
      fileContent = supportFileE2E(language)
    } else if (fileName === 'component') {
      assert(this.ctx.coreData.wizard.chosenFramework)
      fileContent = supportFileComponent(language, this.ctx.coreData.wizard.chosenFramework)
    }

    assert(fileContent)

    await this.scaffoldFile(supportFile, fileContent, 'Scaffold default support file')

    return {
      status: 'valid',
      description: `Added a ${fileName === 'commands' ? 'commands' : 'support'} file, for extending the Cypress api`,
      file: {
        absolute: supportFile,
      },
    }
  }

  private async scaffoldConfig (testingType: 'e2e' | 'component'): Promise<NexusGenObjects['ScaffoldedFile']> {
    debug('scaffoldConfig')

    if (!this.ctx.lifecycleManager.metaState.hasValidConfigFile) {
      this.ctx.lifecycleManager.setConfigFilePath(`cypress.config.${this.ctx.coreData.wizard.chosenLanguage}`)
    }

    const configFilePath = this.ctx.lifecycleManager.configFilePath
    const testingTypeInfo: AddTestingTypeToCypressConfigOptions['info'] = testingType === 'e2e' ? {
      testingType: 'e2e',
    } : {
      testingType: 'component',
      bundler: this.ctx.coreData.wizard.chosenBundler?.package ?? 'webpack',
      framework: this.ctx.coreData.wizard.chosenFramework?.configFramework,
    }

    const result = await addTestingTypeToCypressConfig({
      filePath: configFilePath,
      info: testingTypeInfo,
    })

    if (result.result === 'ADDED' || result.result === 'MERGED') {
      return {
        status: 'valid',
        description: result.result === 'ADDED' ? 'Config file added' : `Added ${testingType} to config file`,
        file: {
          absolute: configFilePath,
          contents: await fs.readFile(configFilePath, 'utf8'),
        },
      }
    }

    return {
      status: 'changes',
      description: 'Merge this code with your existing config file',
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
        description: 'Fixtures folder already exists',
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

  private async scaffoldComponentIndexHtml (chosenFramework: typeof WIZARD_FRAMEWORKS[number]): Promise<NexusGenObjects['ScaffoldedFile']> {
    const componentIndexHtmlPath = path.join(this.projectRoot, 'cypress', 'support', 'component-index.html')

    await this.ensureDir('support')

    return this.scaffoldFile(
      componentIndexHtmlPath,
      chosenFramework.componentIndexHtml(),
      'The HTML used as the wrapper for all component tests',
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
