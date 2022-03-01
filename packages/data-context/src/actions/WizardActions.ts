import type { CodeLanguageEnum, NexusGenEnums, NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import { CodeLanguage, CODE_LANGUAGES } from '@packages/types'
import { Bundler, FrontendFramework, FRONTEND_FRAMEWORKS, detect } from '@packages/scaffold-config'
import assert from 'assert'
import dedent from 'dedent'
import path from 'path'
import fs from 'fs-extra'
import Debug from 'debug'

const debug = Debug('cypress:data-context:wizard-actions')

import type { DataContext } from '..'

interface WizardGetCodeComponent {
  chosenLanguage: CodeLanguage
  chosenFramework: FrontendFramework
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

  setFramework (framework: typeof FRONTEND_FRAMEWORKS[number]['type'] | null): void {
    const next = FRONTEND_FRAMEWORKS.find((x) => x.type === framework)

    this.ctx.coreData.wizard.chosenFramework = framework

    if (next?.supportedBundlers?.length === 1) {
      this.setBundler(next?.supportedBundlers?.[0].type)

      return
    }

    const { chosenBundler } = this.ctx.coreData.wizard

    // if the previous bundler was incompatible with the
    // new framework that was selected, we need to reset it
    const doesNotSupportChosenBundler = (chosenBundler && !new Set(
      this.ctx.wizard.chosenFramework?.supportedBundlers.map((x) => x.type) || [],
    ).has(chosenBundler)) ?? false

    const prevFramework = this.ctx.coreData.wizard.chosenFramework || ''

    if (doesNotSupportChosenBundler || !['react', 'vue'].includes(prevFramework)) {
      this.setBundler(null)
    }
  }

  setBundler (bundler: Bundler | null) {
    this.ctx.coreData.wizard.chosenBundler = bundler

    return this.data
  }

  setCodeLanguage (lang: NexusGenEnums['CodeLanguageEnum']) {
    this.ctx.coreData.wizard.chosenLanguage = lang

    return this.data
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
  }

  /// reset wizard status, useful for when changing to a new project
  resetWizard () {
    this.data.chosenBundler = null
    this.data.chosenFramework = null
    this.data.chosenLanguage = 'js'

    return this.data
  }

  async initialize () {
    if (!this.ctx.currentProject) {
      return
    }

    this.ctx.update((coreData) => {
      coreData.wizard.detectedFramework = null
      coreData.wizard.detectedBundler = null
      coreData.wizard.detectedLanguage = null
    })

    await this.detectLanguage()
    debug('detectedLanguage %s', this.data.detectedLanguage)
    this.data.chosenLanguage = this.data.detectedLanguage || 'js'

    try {
      const detected = detect(await fs.readJson(path.join(this.ctx.currentProject, 'package.json')))

      debug('detected %o', detected)

      if (detected) {
        this.ctx.update((coreData) => {
          coreData.wizard.detectedFramework = detected.framework?.type ?? null
          coreData.wizard.chosenFramework = detected.framework?.type ?? null

          if (!detected.framework?.supportedBundlers[0]) {
            return
          }

          coreData.wizard.detectedBundler = detected.bundler || detected.framework.supportedBundlers[0].type
          coreData.wizard.chosenBundler = detected.bundler || detected.framework.supportedBundlers[0].type
        })
      }
    } catch {
      // Could not detect anything - no problem, no need to do anything.
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

    assert(currentTestingType)
    assert(chosenLanguage)

    switch (currentTestingType) {
      case 'e2e': {
        this.ctx.coreData.scaffoldedFiles = await this.scaffoldE2E()
        this.ctx.lifecycleManager.refreshMetaState()
        this.ctx.actions.project.setForceReconfigureProjectByTestingType({ forceReconfigureProject: false, testingType: 'e2e' })

        return chosenLanguage
      }
      case 'component': {
        this.ctx.coreData.scaffoldedFiles = await this.scaffoldComponent()
        this.ctx.lifecycleManager.refreshMetaState()
        this.ctx.actions.project.setForceReconfigureProjectByTestingType({ forceReconfigureProject: false, testingType: 'component' })

        return chosenLanguage
      }
      default:
        throw new Error('Unreachable')
    }
  }

  private async scaffoldE2E () {
    const scaffolded = await Promise.all([
      this.scaffoldConfig('e2e'),
      this.scaffoldSupport('e2e', this.ctx.coreData.wizard.chosenLanguage),
      this.scaffoldFixtures(),
    ])

    return scaffolded
  }

  private async scaffoldComponent () {
    debug('scaffoldComponent')
    const { chosenBundler, chosenFramework, chosenLanguage } = this.ctx.wizard

    assert(chosenFramework && chosenLanguage && chosenBundler)

    return await Promise.all([
      this.scaffoldConfig('component'),
      this.scaffoldFixtures(),
      this.scaffoldSupport('component', chosenLanguage.type),
      this.getComponentIndexHtml({
        chosenFramework,
        chosenLanguage,
      }),
    ])
  }

  private async scaffoldSupport (fileName: 'e2e' | 'component', language: CodeLanguageEnum): Promise<NexusGenObjects['ScaffoldedFile']> {
    const supportFile = path.join(this.projectRoot, `cypress/support/${fileName}.${language}`)
    const supportDir = path.dirname(supportFile)

    // @ts-ignore
    await this.ctx.fs.mkdir(supportDir, { recursive: true })
    await this.scaffoldFile(supportFile, dedent`
      // TODO: source the example support file
    `, 'Scaffold default support file')

    return {
      status: 'valid',
      description: 'Added a support file, for extending the Cypress api',
      file: {
        absolute: supportFile,
      },
    }
  }

  private configCode (testingType: 'e2e' | 'component', language: CodeLanguageEnum) {
    if (testingType === 'component') {
      const chosenLanguage = CODE_LANGUAGES.find((f) => f.type === language)

      const { chosenBundler, chosenFramework } = this.ctx.wizard

      assert(chosenFramework && chosenLanguage && chosenBundler)

      return chosenFramework.config[chosenLanguage.type](chosenBundler.type)
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
    this.ctx.lifecycleManager.setConfigFilePath(this.ctx.coreData.wizard.chosenLanguage)

    return this.scaffoldFile(
      this.ctx.lifecycleManager.configFilePath,
      configCode,
      'Created a new config file',
    )
  }

  private async scaffoldFixtures (): Promise<NexusGenObjects['ScaffoldedFile']> {
    const exampleScaffoldPath = path.join(this.projectRoot, 'cypress/fixtures/example.json')

    await this.ensureDir('fixtures')

    return this.scaffoldFile(exampleScaffoldPath,
      `${JSON.stringify(FIXTURE_DATA, null, 2)}\n`,
      'Added an example fixtures file/folder')
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

    const relativeComponentIndexHtmlPath = path.join('cypress', 'support', 'component-index.html')

    return this.scaffoldFile(
      path.join(this.projectRoot, relativeComponentIndexHtmlPath),
      template,
      'The HTML used as the wrapper for all component tests',
    )
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
          <div id="__cy_root"></div>
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
