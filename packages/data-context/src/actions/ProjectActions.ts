import type { CodeGenType, MutationSetProjectPreferencesArgs, NexusGenObjects, NexusGenUnions, TestingTypeEnum } from '@packages/graphql/src/gen/nxs.gen'
import type { InitializeProjectOptions, FoundBrowser, FoundSpec, LaunchOpts, OpenProjectLaunchOptions, Preferences, TestingType, ReceivedCypressOptions, AddProject } from '@packages/types'
import execa from 'execa'
import path from 'path'
import assert from 'assert'

import type { ProjectShape } from '../data/coreDataShape'

import type { DataContext } from '..'
import { codeGenerator, SpecOptions } from '../codegen'
import templates from '../codegen/templates'
import { insertValuesInConfigFile } from '../util'

export interface ProjectApiShape {
  /**
   * "Initializes" the given mode, since plugins can define the browsers available
   * TODO(tim): figure out what this is actually doing, it seems it's necessary in
   *   order for CT to startup
   */
  openProjectCreate(args: InitializeProjectOptions, options: OpenProjectLaunchOptions): Promise<unknown>
  launchProject(browser: FoundBrowser, spec: Cypress.Spec, options: LaunchOpts): void
  insertProjectToCache(projectRoot: string): Promise<void>
  removeProjectFromCache(projectRoot: string): Promise<void>
  getProjectRootsFromCache(): Promise<string[]>
  insertProjectPreferencesToCache(projectTitle: string, preferences: Preferences): void
  getProjectPreferencesFromCache(): Promise<Record<string, Preferences>>
  clearLatestProjectsCache(): Promise<unknown>
  clearProjectPreferences(projectTitle: string): Promise<unknown>
  clearAllProjectPreferences(): Promise<unknown>
  closeActiveProject(shouldCloseBrowser?: boolean): Promise<unknown>
  getConfig(): ReceivedCypressOptions | undefined
  getCurrentProjectSavedState(): {} | undefined
  setPromptShown(slug: string): void
  getDevServer (): {
    updateSpecs: (specs: FoundSpec[]) => void
  }
}

type SetSpecsFoundBySpecPattern = {
  path: string
  testingType: Cypress.TestingType
  specPattern?: Cypress.Config['specPattern']
  ignoreSpecPattern?: Cypress.Config['ignoreSpecPattern']
  additionalIgnorePattern?: string | string[]
}

export class ProjectActions {
  constructor (private ctx: DataContext) {}

  private get api () {
    return this.ctx._apis.projectApi
  }

  async clearCurrentProject () {
    this.ctx.update((d) => {
      d.currentProject = null
      d.currentTestingType = null
      d.baseError = null
      d.warnings = []
    })

    this.ctx.lifecycleManager.clearCurrentProject()
    await this.api.closeActiveProject()
  }

  private get projects () {
    return this.ctx.projectsList
  }

  private set projects (projects: ProjectShape[]) {
    this.ctx.coreData.app.projects = projects
  }

  openDirectoryInIDE (projectPath: string) {
    this.ctx.debug(`opening ${projectPath} in ${this.ctx.coreData.localSettings.preferences.preferredEditorBinary}`)

    if (!this.ctx.coreData.localSettings.preferences.preferredEditorBinary) {
      return
    }

    if (this.ctx.coreData.localSettings.preferences.preferredEditorBinary === 'computer') {
      this.ctx.actions.electron.showItemInFolder(projectPath)
    }

    execa(this.ctx.coreData.localSettings.preferences.preferredEditorBinary, [projectPath])
  }

  setCurrentTestingType (type: TestingType) {
    this.ctx.lifecycleManager.setCurrentTestingType(type)
  }

  async setCurrentProject (projectRoot: string) {
    await this.clearCurrentProject()
    this.ctx.lifecycleManager.setCurrentProject(projectRoot)
  }

  // Temporary: remove after other refactor lands
  setCurrentProjectAndTestingTypeForTestSetup (projectRoot: string) {
    this.ctx.lifecycleManager.clearCurrentProject()
    this.ctx.lifecycleManager.setCurrentProject(projectRoot)
    this.ctx.lifecycleManager.setCurrentTestingType('e2e')
    // @ts-expect-error - we are setting this as a convenience for our integration tests
    this.ctx._modeOptions = {}
  }

  async loadProjects () {
    const projectRoots = await this.api.getProjectRootsFromCache()

    this.projects = [
      ...this.projects,
      ...projectRoots.map((projectRoot) => ({ projectRoot })),
    ]

    return this.projects
  }

  async initializeActiveProject (options: OpenProjectLaunchOptions = {}) {
    assert(this.ctx.currentProject, 'Cannot initialize project without an active project')
    assert(this.ctx.coreData.currentTestingType, 'Cannot initialize project without choosing testingType')

    const allModeOptionsWithLatest: InitializeProjectOptions = {
      ...this.ctx.modeOptions,
      projectRoot: this.ctx.currentProject,
      testingType: this.ctx.coreData.currentTestingType,
    }

    try {
      await this.api.closeActiveProject()

      return await this.api.openProjectCreate(allModeOptionsWithLatest, {
        ...options,
        ctx: this.ctx,
      })
    } catch (e) {
      // TODO(tim): remove / replace with ctx.log.error
      // eslint-disable-next-line
      console.error(e)
      throw e
    }
  }

  createProject () {
    //
  }

  async addProjectFromElectronNativeFolderSelect () {
    const path = await this.ctx.actions.electron.showOpenDialog()

    if (!path) {
      return
    }

    await this.addProject({ path })

    this.ctx.emitter.toLaunchpad()
  }

  async addProject (args: AddProject) {
    const projectRoot = await this.getDirectoryPath(args.path)

    const found = this.projects.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      this.projects.push({ projectRoot })
      await this.api.insertProjectToCache(projectRoot)
    }

    if (args.open) {
      await this.setCurrentProject(projectRoot)
    }
  }

  private async getDirectoryPath (projectRoot: string) {
    try {
      const { dir, base } = path.parse(projectRoot)
      const fullPath = path.join(dir, base)
      const dirStat = await this.ctx.fs.stat(fullPath)

      if (dirStat.isDirectory()) {
        return fullPath
      }

      return dir
    } catch (exception) {
      throw Error(`Cannot add ${projectRoot} to projects as it does not exist in the file system`)
    }
  }

  async launchProject (testingType: TestingTypeEnum | null, options: LaunchOpts, specPath?: string | null) {
    if (!this.ctx.currentProject) {
      return null
    }

    testingType = testingType || this.ctx.coreData.currentTestingType

    if (!testingType) {
      return null
    }

    let activeSpec: FoundSpec | undefined

    if (specPath) {
      activeSpec = this.ctx.project.getCurrentSpecByAbsolute(specPath)
    }

    // Ensure that we have loaded browsers to choose from
    if (this.ctx.appData.refreshingBrowsers) {
      await this.ctx.appData.refreshingBrowsers
    }

    const browser = this.ctx.coreData.chosenBrowser ?? this.ctx.appData.browsers?.[0]

    if (!browser) {
      return null
    }

    // launchProject expects a spec when opening browser for url navigation.
    // We give it an empty spec if none is passed so as to land on home page
    const emptySpec: Cypress.Spec = {
      name: '',
      absolute: '',
      relative: '',
      specType: testingType === 'e2e' ? 'integration' : 'component',
    }

    this.ctx.coreData.currentTestingType = testingType

    return this.api.launchProject(browser, activeSpec ?? emptySpec, options)
  }

  removeProject (projectRoot: string) {
    const found = this.projects.find((x) => x.projectRoot === projectRoot)

    if (!found) {
      throw new Error(`Cannot remove ${projectRoot}, it is not a known project`)
    }

    this.projects = this.projects.filter((project) => project.projectRoot !== projectRoot)

    return this.api.removeProjectFromCache(projectRoot)
  }

  syncProjects () {
    //
  }

  async createConfigFile (type?: 'component' | 'e2e' | null) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create config file without currentProject.`)
    }

    let obj: { [k: string]: object } = {
      e2e: {},
      component: {},
    }

    if (type) {
      obj = {
        [type]: {},
      }
    }

    await this.ctx.fs.writeFile(this.ctx.lifecycleManager.configFilePath, `module.exports = ${JSON.stringify(obj, null, 2)}`)
  }

  async setProjectIdInConfigFile (projectId: string) {
    return insertValuesInConfigFile(this.ctx.lifecycleManager.configFilePath, { projectId }, { get (id: string) {
      return Error(id)
    } })
  }

  async clearLatestProjectCache () {
    await this.api.clearLatestProjectsCache()
  }

  async clearProjectPreferencesCache (projectTitle: string) {
    await this.api.clearProjectPreferences(projectTitle)
  }

  async clearAllProjectPreferencesCache () {
    await this.api.clearAllProjectPreferences()
  }

  setPromptShown (slug: string) {
    this.api.setPromptShown(slug)
  }

  async createComponentIndexHtml (template: string) {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create index.html without currentProject.`)
    }

    if (this.ctx.lifecycleManager.isTestingTypeConfigured('component')) {
      const indexHtmlPath = path.resolve(project, 'cypress/component/support/index.html')

      await this.ctx.fs.outputFile(indexHtmlPath, template)
    }
  }

  setSpecs (specs: FoundSpec[]) {
    this.ctx.project.setSpecs(specs)
  }

  async setProjectPreferences (args: MutationSetProjectPreferencesArgs) {
    if (!this.ctx.currentProject) {
      throw Error(`Cannot save preferences without currentProject.`)
    }

    this.api.insertProjectPreferencesToCache(this.ctx.lifecycleManager.projectTitle, args)
  }

  async codeGenSpec (codeGenCandidate: string, codeGenType: CodeGenType, erroredCodegenCandidate?: string | null): Promise<NexusGenUnions['GeneratedSpecResult']> {
    const project = this.ctx.currentProject

    if (!project) {
      throw Error(`Cannot create spec without currentProject.`)
    }

    const parsed = path.parse(codeGenCandidate)

    const defaultCText = '.cy'
    const possibleExtensions = ['.cy', '.spec', '.test', '-spec', '-test', '_spec']

    const getFileExtension = () => {
      if (erroredCodegenCandidate) {
        return ''
      }

      if (codeGenType === 'e2e') {
        return (
          possibleExtensions.find((ext) => {
            return codeGenCandidate.endsWith(ext + parsed.ext)
          }) || parsed.ext
        )
      }

      return defaultCText
    }

    const getCodeGenPath = () => {
      return codeGenType === 'e2e' || erroredCodegenCandidate
        ? this.ctx.path.join(
          project,
          codeGenCandidate,
        )
        : codeGenCandidate
    }

    const specFileExtension = getFileExtension()
    const codeGenPath = getCodeGenPath()

    const newSpecCodeGenOptions = new SpecOptions(this.ctx, {
      codeGenPath,
      codeGenType,
      specFileExtension,
      erroredCodegenCandidate,
    })

    let codeGenOptions = await newSpecCodeGenOptions.getCodeGenOptions()

    if ((codeGenType === 'component' || codeGenType === 'story') && !erroredCodegenCandidate) {
      const filePathAbsolute = path.join(path.parse(codeGenPath).dir, codeGenOptions.fileName)
      const filePathRelative = path.relative(this.ctx.currentProject || '', filePathAbsolute)

      let foundExt

      for await (const ext of possibleExtensions) {
        const file = filePathRelative.replace(defaultCText, ext)

        const matchesSpecPattern = await this.ctx.project.matchesSpecPattern(file)

        if (matchesSpecPattern) {
          foundExt = ext
          break
        }
      }

      if (!foundExt) {
        return {
          fileName: filePathRelative,
          erroredCodegenCandidate: codeGenPath,
        }
      }

      codeGenOptions = {
        ...codeGenOptions,
        fileName: codeGenOptions.fileName.replace(defaultCText, foundExt),
      }
    }

    const codeGenResults = await codeGenerator(
      { templateDir: templates[codeGenType], target: path.parse(codeGenPath).dir },
      codeGenOptions,
    )

    if (!codeGenResults.files[0] || codeGenResults.failed[0]) {
      throw (codeGenResults.failed[0] || 'Unable to generate spec')
    }

    const [newSpec] = codeGenResults.files

    const cfg = this.ctx.project.getConfig()

    if (cfg && this.ctx.currentProject) {
      const testingType = (codeGenType === 'component' || codeGenType === 'story') ? 'component' : 'e2e'

      const { specs } = await this.setSpecsFoundBySpecPattern({
        path: this.ctx.currentProject,
        testingType,
        specPattern: cfg[testingType]?.specPattern,
        ignoreSpecPattern: cfg[testingType]?.ignoreSpecPattern,
        additionalIgnorePattern: testingType === 'component' ? cfg?.e2e?.specPattern : undefined,
      })

      if (specs) {
        if (testingType === 'component') {
          this.api.getDevServer().updateSpecs(specs)
        }
      }
    }

    return {
      status: 'valid',
      file: { absolute: newSpec.file, contents: newSpec.content },
      description: 'Generated spec',
    }
  }

  async setSpecsFoundBySpecPattern ({ path, testingType, specPattern, ignoreSpecPattern, additionalIgnorePattern }: SetSpecsFoundBySpecPattern) {
    const toArray = (val?: string | string[]) => val ? typeof val === 'string' ? [val] : val : undefined

    specPattern = toArray(specPattern)

    ignoreSpecPattern = toArray(ignoreSpecPattern) || []

    // exclude all specs matching e2e if in component testing
    additionalIgnorePattern = toArray(additionalIgnorePattern) || []

    if (!specPattern) {
      throw Error('could not find pattern to load specs')
    }

    const specs = await this.ctx.project.findSpecs(
      path,
      testingType,
      specPattern,
      ignoreSpecPattern,
      additionalIgnorePattern,
    )

    this.ctx.actions.project.setSpecs(specs)

    return { specs, specPattern, ignoreSpecPattern, additionalIgnorePattern }
  }

  async reconfigureProject () {
    // Initialize active project close first the current project
    await this.initializeActiveProject()
    this.ctx.actions.wizard.resetWizard()
    this.ctx.actions.electron.refreshBrowserWindow()
    this.ctx.actions.electron.showBrowserWindow()
  }

  get defaultE2EPath () {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create e2e directory without currentProject.`)

    return path.join(projectRoot, 'cypress', 'e2e')
  }

  async scaffoldIntegration (): Promise<NexusGenObjects['ScaffoldedFile'][]> {
    const projectRoot = this.ctx.currentProject

    assert(projectRoot, `Cannot create spec without currentProject.`)

    const results = await codeGenerator(
      { templateDir: templates['scaffoldIntegration'], target: this.defaultE2EPath },
      {},
    )

    if (results.failed.length) {
      throw new Error(`Failed generating files: ${results.failed.map((e) => `${e}`)}`)
    }

    return results.files.map(({ status, file, content }) => {
      return {
        status: (status === 'add' || status === 'overwrite') ? 'valid' : 'skipped',
        file: { absolute: file, contents: content },
        description: 'Generated spec',
      }
    })
  }
}
