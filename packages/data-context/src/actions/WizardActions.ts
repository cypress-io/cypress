import type { CodeLanguageEnum, NexusGenEnums, NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import { CODE_LANGUAGES } from '@packages/types'
import { detect, WIZARD_FRAMEWORKS, WIZARD_BUNDLERS, commandsFileBody, supportFileComponent, supportFileE2E } from '@packages/scaffold-config'
import assert from 'assert'
import dedent from 'dedent'
import path from 'path'
import Debug from 'debug'

const debug = Debug('cypress:data-context:wizard-actions')

import type { DataContext } from '..'

interface WizardGetCodeComponent {
  chosenLanguage: 'js' | 'ts'
  chosenFramework: typeof WIZARD_FRAMEWORKS[number]
}

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

    // TODO: tgriesser, clean this up as part of UNIFY-1256
    if (!currentTestingType || !chosenLanguage) {
      return
    }

    switch (currentTestingType) {
      case 'e2e': {
        this.ctx.coreData.scaffoldedFiles = await this.scaffoldE2E()
        this.ctx.lifecycleManager.refreshMetaState()
        this.ctx.actions.project.setForceReconfigureProjectByTestingType({ forceReconfigureProject: false, testingType: 'e2e' })

        return
      }
      case 'component': {
        const { chosenBundler, chosenFramework } = this.ctx.coreData.wizard

        if (!chosenBundler || !chosenFramework) {
          return
        }

        this.ctx.coreData.scaffoldedFiles = await this.scaffoldComponent()
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
      this.getComponentIndexHtml({
        chosenFramework,
        chosenLanguage,
      }),
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

    await this.scaffoldFile(supportFile, fileContent, '')

    return {
      status: 'valid',
      description: '',
      file: {
        absolute: supportFile,
      },
    }
  }

  private configCode (testingType: 'e2e' | 'component', language: CodeLanguageEnum) {
    if (testingType === 'component') {
      const chosenLanguage = CODE_LANGUAGES.find((f) => f.type === language)

      const { chosenBundler, chosenFramework } = this.ctx.coreData.wizard

      assert(chosenFramework && chosenLanguage && chosenBundler && this.ctx.currentProject)

      return chosenFramework.createCypressConfig({
        language: chosenLanguage.type,
        bundler: chosenBundler.type,
        framework: chosenFramework.configFramework,
        projectRoot: this.ctx.currentProject,
      })
    }

    return this.wizardGetConfigCodeE2E(language)
  }

  private async scaffoldConfig (testingType: 'e2e' | 'component'): Promise<NexusGenObjects['ScaffoldedFile']> {
    debug('scaffoldConfig')

    if (this.ctx.lifecycleManager.metaState.hasValidConfigFile) {
      const { ext } = path.parse(this.ctx.lifecycleManager.configFilePath)
      const foundLanguage = ext === '.ts' ? 'ts' : 'js'
      const configCode = this.configCode(testingType, foundLanguage)

      return {
        status: 'changes',
        description: 'Merge this code with your existing config file',
        file: {
          absolute: this.ctx.lifecycleManager.configFilePath,
          contents: configCode,
        },
      }
    }

    const configCode = this.configCode(testingType, this.ctx.coreData.wizard.chosenLanguage)

    // only do this if config file doesn't exist
    this.ctx.lifecycleManager.setConfigFilePath(`cypress.config.${this.ctx.coreData.wizard.chosenLanguage}`)

    return this.scaffoldFile(this.ctx.lifecycleManager.configFilePath, configCode, '')
  }

  private async scaffoldFixtures (): Promise<NexusGenObjects['ScaffoldedFile']> {
    const exampleScaffoldPath = path.join(this.projectRoot, 'cypress/fixtures/example.json')

    await this.ensureDir('fixtures')

    return this.scaffoldFile(exampleScaffoldPath, JSON.stringify(FIXTURE_DATA, null, 2), '')
  }

  private wizardGetConfigCodeE2E (lang: CodeLanguageEnum): string {
    const codeBlocks: string[] = []

    codeBlocks.push(lang === 'ts' ? `import { defineConfig } from 'cypress'` : `const { defineConfig } = require('cypress')`)
    codeBlocks.push('')
    codeBlocks.push(lang === 'ts' ? `export default defineConfig({` : `module.exports = defineConfig({`)
    codeBlocks.push(`  ${E2E_SCAFFOLD_BODY.replace(/\n/g, '\n  ')}`)

    codeBlocks.push('})\n')

    return codeBlocks.join('\n')
  }

  private async getComponentIndexHtml (opts: WizardGetCodeComponent): Promise<NexusGenObjects['ScaffoldedFile']> {
    const [storybookInfo] = await Promise.all([
      this.ctx.storybook.loadStorybookInfo(),
      this.ensureDir('component'),
    ])
    const framework = opts.chosenFramework.type
    let headModifier = ''
    let bodyModifier = ''

    if (framework === 'nextjs') {
      headModifier += '<div id="__next_css__DO_NOT_USE__"></div>'
    }

    const previewHead = storybookInfo?.files.find(({ name }) => name === 'preview-head.html')

    if (previewHead) {
      headModifier += previewHead.content
    }

    const previewBody = storybookInfo?.files.find(({ name }) => name === 'preview-body.html')

    if (previewBody) {
      headModifier += previewBody.content
    }

    const template = this.getComponentTemplate({
      headModifier,
      bodyModifier,
    })

    const componentIndexHtmlPath = path.join(this.projectRoot, 'cypress', 'support', 'component-index.html')

    return this.scaffoldFile(componentIndexHtmlPath, template, '')
  }

  private getComponentTemplate = (opts: { headModifier: string, bodyModifier: string }) => {
    // TODO: Properly indent additions and strip newline if none
    return dedent`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <title>Components App</title>
          ${opts.headModifier}
        </head>
        <body>
          ${opts.bodyModifier}
          <div data-cy-root></div>
        </body>
      </html>`
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
          description,
          file: {
            absolute: filePath,
          },
        }
      }

      return {
        status: 'error',
        description: e.message,
        file: {
          absolute: filePath,
          contents,
        },
      }
    }
  }

  private ensureDir (type: 'component' | 'e2e' | 'fixtures') {
    return this.ctx.fs.ensureDir(path.join(this.projectRoot, 'cypress', type))
  }
}

const E2E_SCAFFOLD_BODY = dedent`
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
`

const FIXTURE_DATA = {
  'name': 'Using fixtures to represent data',
  'email': 'hello@cypress.io',
  'body': 'Fixtures are a great way to mock data for responses to routes',
}
