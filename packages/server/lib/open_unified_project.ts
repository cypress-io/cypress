import browsers from './browsers'
import { ProjectBase } from './project-base'
import { getSpecUrl } from './project_utils'

const factory = () => {
  let __openProject: ProjectBase<any>

  const getProject = () => {
    if (!__openProject) {
      throw Error('Must call #create before accessing the current project!')
    }
    return __openProject
  }

  const getBrowsers = async () => {
    const all = await browsers.getAllBrowsersWith()
    return all
  }

  const create = async (args: any) => {
    const testingType = args.testingType === 'component' ? 'ct' : 'e2e'
    // temp hack to test opening different runners
    // if CT, open use packages/runner-ct as project root
    // if E2E, open use packages/runner as project root
    const projectRoot = testingType === 'ct' 
      ? args.projectRoot.replace('springboard', 'runner-ct')
      : args.projectRoot.replace('springboard', 'runner')

    const project = new ProjectBase({
      projectType: testingType,
      projectRoot,
      options: {
        testingType: args.testingType,
      },
    })

    const browsers = await getBrowsers()
    await project.initializeConfig({ browsers })

    __openProject = project
  }

  const initializePlugins = async () => {
    const project = getProject()
    const updatedConfig = await project.initializePlugins(
      await project.getConfig(),
      project.options
    )
    project.__setConfig(updatedConfig)
  }

  const initializeServer = async () => {
    const project = getProject()
    await project.open()
  }

  const initializeRunner = async () => {
    const project = getProject()

    // reset server/websockets
    // TODO: Do we need this?
    project.reset()

    const spec = {
      name: 'All Specs',
      absolute: '__all',
      relative: '__all',
      specType: 'component',
    }

    const url = getSpecUrl({
      absoluteSpecPath: spec.absolute,
      specType: spec.specType as 'integration' | 'component',
      browserUrl: project.cfg.browserUrl,
      integrationFolder: project.cfg.integrationFolder,
      componentFolder: project.cfg.componentFolder,
      projectRoot: project.projectRoot,
    })

    // hard-code chrome for testing
    const chrome = project.cfg.browsers!.find(x => x.name === 'chrome')!
    console.log('chrome!', chrome)

    // set spec/browser
    project.setCurrentSpecAndBrowser(spec, chrome)    

    const config = await project.getConfig()
    // required options for launching
    const options = {
      url,
      browser: chrome,
      browsers: config.browsers,
      userAgent: config.userAgent,
      proxyUrl: config.proxyUrl,
      proxyServer: config.proxyServer,
      socketIoRoute: config.socketIoRoute,
      chromeWebSecurity: config.chromeWebSecurity,
      isTextTerminal: config.isTextTerminal,
      downloadsFolder: config.downloadsFolder,
    }

    return browsers.open(chrome, options, project.getAutomation())
  }

  const killActiveRunner = async () => {
  }

  return {
    create,
    initializePlugins,
    initializeServer,
    initializeRunner,
    killActiveRunner,
    getProject
  }
}

export const openUnifiedProject = factory()