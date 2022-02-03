import type { CodeLanguageEnum, NexusGenEnums, NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import { Bundler, CodeLanguage, CODE_LANGUAGES, FrontendFramework } from '@packages/types'
import assert from 'assert'
import dedent from 'dedent'
import fs from 'fs'
import path from 'path'

import type { DataContext } from '..'

interface WizardGetCodeComponent {
  chosenLanguage: CodeLanguage
  chosenFramework: FrontendFramework
  chosenBundler: Bundler
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

  setFramework (framework: NexusGenEnums['FrontendFrameworkEnum'] | null) {
    this.ctx.coreData.wizard.chosenFramework = framework

    if (framework !== 'react' && framework !== 'vue') {
      return this.setBundler('webpack')
    }

    return this.setBundler(null)
  }

  setBundler (bundler: NexusGenEnums['SupportedBundlers'] | null) {
    this.ctx.coreData.wizard.chosenBundler = bundler

    return this.data
  }

  setCodeLanguage (lang: NexusGenEnums['CodeLanguageEnum']) {
    this.ctx.coreData.wizard.chosenLanguage = lang

    return this.data
  }

  completeSetup () {
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

  /**
   * Scaffolds the testing type, by creating the necessary files & assigning to
   */
  async scaffoldTestingType () {
    const { currentTestingType, wizard: { chosenLanguage } } = this.ctx.coreData

    assert(currentTestingType)
    assert(chosenLanguage)
    assert(!this.ctx.lifecycleManager.isTestingTypeConfigured(currentTestingType), `Cannot call this if the testing type (${currentTestingType}) has not been configured`)
    switch (currentTestingType) {
      case 'e2e': {
        this.ctx.coreData.scaffoldedFiles = await this.scaffoldE2E()
        this.ctx.lifecycleManager.refreshMetaState()

        return chosenLanguage
      }
      case 'component': {
        this.ctx.coreData.scaffoldedFiles = await this.scaffoldComponent()
        this.ctx.lifecycleManager.refreshMetaState()

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
    const { chosenBundler, chosenFramework, chosenLanguage } = this.ctx.wizard

    assert(chosenFramework && chosenLanguage && chosenBundler)

    return await Promise.all([
      this.scaffoldConfig('component'),
      this.scaffoldFixtures(),
      this.scaffoldSupport('component', chosenLanguage.type),
      this.getComponentIndexHtml({
        chosenBundler,
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

      return this.wizardGetConfigCodeComponent({
        chosenLanguage,
        chosenFramework,
        chosenBundler,
      })
    }

    return this.wizardGetConfigCodeE2E(language)
  }

  private async scaffoldConfig (testingType: 'e2e' | 'component'): Promise<NexusGenObjects['ScaffoldedFile']> {
    if (!fs.existsSync(this.ctx.lifecycleManager.configFilePath)) {
      this.ctx.lifecycleManager.setConfigFilePath(this.ctx.coreData.wizard.chosenLanguage)

      const configCode = this.configCode(testingType, this.ctx.coreData.wizard.chosenLanguage)

      return this.scaffoldFile(
        this.ctx.lifecycleManager.configFilePath,
        configCode,
        'Created a new config file',
      )
    }

    const { ext } = path.parse(this.ctx.lifecycleManager.configFilePath)

    const configCode = this.configCode(testingType, ext === '.ts' ? 'ts' : 'js')

    return {
      status: 'changes',
      description: 'Merge this code with your existing config file',
      file: {
        absolute: this.ctx.lifecycleManager.configFilePath,
        contents: configCode,
      },
    }
  }

  private async scaffoldFixtures (): Promise<NexusGenObjects['ScaffoldedFile']> {
    const exampleScaffoldPath = path.join(this.projectRoot, 'cypress/fixtures/example.json')
    const fixturesDir = path.dirname(exampleScaffoldPath)

    try {
      await this.ctx.fs.stat(fixturesDir)

      return {
        status: 'skipped',
        file: {
          absolute: exampleScaffoldPath,
        },
        description: 'Fixtures directory already exists, skipping',
      }
    } catch (e) {
      await this.ensureDir('fixtures')
      await this.ctx.fs.writeFile(exampleScaffoldPath, `${JSON.stringify(FIXTURE_DATA, null, 2)}\n`)

      return {
        status: 'valid',
        description: 'Added an example fixtures file/folder',
        file: {
          absolute: exampleScaffoldPath,
        },
      }
    }
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

  private wizardGetConfigCodeComponent (opts: WizardGetCodeComponent): string {
    const codeBlocks: string[] = []
    const { chosenBundler, chosenFramework, chosenLanguage } = opts

    codeBlocks.push(chosenLanguage.type === 'ts' ? `import { defineConfig } from 'cypress'` : `const { defineConfig } = require('cypress')`)
    codeBlocks.push('')
    codeBlocks.push(chosenLanguage.type === 'ts' ? `export default defineConfig({` : `module.exports = defineConfig({`)
    codeBlocks.push(`  // Component testing, ${chosenLanguage.name}, ${chosenFramework.name}, ${chosenBundler.name}`)

    codeBlocks.push(`  ${COMPONENT_SCAFFOLD_BODY({
      lang: chosenLanguage.type,
      requirePath: chosenBundler.package,
      configOptionsString: '{}',
    }).replace(/\n/g, '\n  ')}`)

    codeBlocks.push(`})\n`)

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

    return this.scaffoldFile(
      path.join(this.projectRoot, 'cypress', 'component', 'index.html'),
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
    if (fs.existsSync(filePath)) {
      return {
        status: 'skipped',
        description: 'File already exists',
        file: {
          absolute: filePath,
        },
      }
    }

    try {
      await this.ctx.fs.writeFile(filePath, contents)

      return {
        status: 'valid',
        description,
        file: {
          absolute: filePath,
        },
      }
    } catch (e: any) {
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

interface ComponentScaffoldOpts {
  lang: CodeLanguageEnum
  requirePath: string
  configOptionsString: string
  specPattern?: string
}

const COMPONENT_SCAFFOLD_BODY = (opts: ComponentScaffoldOpts) => {
  return dedent`
    component: {
      devServer: import('${opts.requirePath}'),
      devServerConfig: ${opts.configOptionsString}
    },
  `
}

const FIXTURE_DATA = {
  'name': 'Using fixtures to represent data',
  'email': 'hello@cypress.io',
  'body': 'Fixtures are a great way to mock data for responses to routes',
}
