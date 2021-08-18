// import type { Cfg } from '@packages/server/lib/project-base'

// import type { ResolvedConfigurationOptions, ResolvedFromConfig, } from "@packages/server/lib/config";
type ResolvedConfigurationOptions = any
type ResolvedFromConfig = any
import { enumType } from "nexus";
import { nxs } from "nexus-decorators";

const ResolvedConfigOptionEnum = enumType({
  name: 'ResolvedConfigOption',
  members: ['plugin', 'env', 'default', 'runtime', 'config'] as const
})

@nxs.objectType()
class ResolvedOption {
  constructor(private resolveFromConfig: ResolvedFromConfig) {}

  @nxs.field.string()
  get value () {
    return this.resolveFromConfig.value.toString()
  }

  @nxs.field.type(() => ResolvedConfigOptionEnum)
  get from () {
    return this.resolveFromConfig.from
  }
}

@nxs.objectType({
  description: 'Resolve config for a project',
})
export class ResolvedConfig {
  constructor (private resolvedConfig: ResolvedConfigurationOptions) {}

  @nxs.field.type(() => ResolvedOption)
  get baseUrl () {
    return this.resolvedConfig.baseUrl ? new ResolvedOption(this.resolvedConfig.baseUrl) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get projectId () {
    return this.resolvedConfig.projectId ? new ResolvedOption(this.resolvedConfig.projectId) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get env () {
    return this.resolvedConfig.env ? new ResolvedOption(this.resolvedConfig.env) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get ignoreTestFiles () {
    return this.resolvedConfig.ignoreTestFiles ? new ResolvedOption(this.resolvedConfig.ignoreTestFiles) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get numTestsKeptInMemory () {
    return this.resolvedConfig.numTestsKeptInMemory ? new ResolvedOption(this.resolvedConfig.numTestsKeptInMemory) : null
  }


  @nxs.field.type(() => ResolvedOption)
  get port () {
    return this.resolvedConfig.port ? new ResolvedOption(this.resolvedConfig.port) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get reporter () {
    return this.resolvedConfig.reporter ? new ResolvedOption(this.resolvedConfig.reporter) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get watchForFileChanges () {
    return this.resolvedConfig.watchForFileChanges ? new ResolvedOption(this.resolvedConfig.watchForFileChanges) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get defaultCommandTimeout () {
    return this.resolvedConfig.defaultCommandTimeout ? new ResolvedOption(this.resolvedConfig.defaultCommandTimeout) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get execTimeout () {
    return this.resolvedConfig.execTimeout ? new ResolvedOption(this.resolvedConfig.execTimeout) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get pageLoadTimeout () {
    return this.resolvedConfig.pageLoadTimeout ? new ResolvedOption(this.resolvedConfig.pageLoadTimeout) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get requestTimeout () {
    return this.resolvedConfig.requestTimeout ? new ResolvedOption(this.resolvedConfig.requestTimeout) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get taskTimeout () {
    return this.resolvedConfig.taskTimeout ? new ResolvedOption(this.resolvedConfig.taskTimeout) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get fileServerFolder () {
    return this.resolvedConfig.fileServerFolder ? new ResolvedOption(this.resolvedConfig.fileServerFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get fixturesFolder () {
    return this.resolvedConfig.fixturesFolder ? new ResolvedOption(this.resolvedConfig.fixturesFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get integrationFolder () {
    return this.resolvedConfig.integrationFolder ? new ResolvedOption(this.resolvedConfig.integrationFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get downloadsFolder () {
    return this.resolvedConfig.downloadsFolder ? new ResolvedOption(this.resolvedConfig.downloadsFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get nodeVersion () {
    return this.resolvedConfig.nodeVersion ? new ResolvedOption(this.resolvedConfig.nodeVersion) : null
  }
  
  @nxs.field.type(() => ResolvedOption)
  get pluginsFile () {
    return this.resolvedConfig.pluginsFile ? new ResolvedOption(this.resolvedConfig.pluginsFile) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get redirectionLimit () {
    return this.resolvedConfig.redirectionLimit ? new ResolvedOption(this.resolvedConfig.redirectionLimit) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get resolvedNodePath () {
    return this.resolvedConfig.resolvedNodePath ? new ResolvedOption(this.resolvedConfig.resolvedNodePath) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get resolvedNodeVersion () {
    return this.resolvedConfig.resolvedNodeVersion ? new ResolvedOption(this.resolvedConfig.resolvedNodeVersion) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get screenshotOnRunFailure () {
    return this.resolvedConfig.screenshotOnRunFailure ? new ResolvedOption(this.resolvedConfig.screenshotOnRunFailure) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get screenshotsFolder () {
    return this.resolvedConfig.screenshotsFolder ? new ResolvedOption(this.resolvedConfig.screenshotsFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get supportFile () {
    return this.resolvedConfig.supportFile ? new ResolvedOption(this.resolvedConfig.supportFile) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get videosFolder () {
    return this.resolvedConfig.videosFolder ? new ResolvedOption(this.resolvedConfig.videosFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get trashAssetsBeforeRuns () {
    return this.resolvedConfig.trashAssetsBeforeRuns ? new ResolvedOption(this.resolvedConfig.trashAssetsBeforeRuns) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get videoCompression () {
    return this.resolvedConfig.videoCompression ? new ResolvedOption(this.resolvedConfig.videoCompression) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get video () {
    return this.resolvedConfig.video ? new ResolvedOption(this.resolvedConfig.video) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get videoUploadOnPasses () {
    return this.resolvedConfig.videoUploadOnPasses ? new ResolvedOption(this.resolvedConfig.videoUploadOnPasses) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get chromeWebSecurity () {
    return this.resolvedConfig.chromeWebSecurity ? new ResolvedOption(this.resolvedConfig.chromeWebSecurity) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get viewportHeight () {
    return this.resolvedConfig.viewportHeight ? new ResolvedOption(this.resolvedConfig.viewportHeight) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get viewportWidth () {
    return this.resolvedConfig.viewportWidth ? new ResolvedOption(this.resolvedConfig.viewportWidth) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get animationDistanceThreshold () {
    return this.resolvedConfig.animationDistanceThreshold ? new ResolvedOption(this.resolvedConfig.animationDistanceThreshold) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get waitForAnimations () {
    return this.resolvedConfig.waitForAnimations ? new ResolvedOption(this.resolvedConfig.waitForAnimations) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get scrollBehavior () {
    return this.resolvedConfig.scrollBehavior ? new ResolvedOption(this.resolvedConfig.scrollBehavior) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get experimentalSessionSupport () {
    return this.resolvedConfig.experimentalSessionSupport ? new ResolvedOption(this.resolvedConfig.experimentalSessionSupport) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get experimentalInteractiveRunEvents () {
    return this.resolvedConfig.experimentalInteractiveRunEvents ? new ResolvedOption(this.resolvedConfig.experimentalInteractiveRunEvents) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get experimentalSourceRewriting () {
    return this.resolvedConfig.experimentalSourceRewriting ? new ResolvedOption(this.resolvedConfig.experimentalSourceRewriting) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get experimentalStudio () {
    return this.resolvedConfig.experimentalStudio ? new ResolvedOption(this.resolvedConfig.experimentalStudio) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get retries () {
    return this.resolvedConfig.retries ? new ResolvedOption(this.resolvedConfig.retries) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get includeShadowDom () {
    return this.resolvedConfig.includeShadowDom ? new ResolvedOption(this.resolvedConfig.includeShadowDom) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get blockHosts () {
    return this.resolvedConfig.blockHosts ? new ResolvedOption(this.resolvedConfig.blockHosts) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get componentFolder () {
    return this.resolvedConfig.componentFolder ? new ResolvedOption(this.resolvedConfig.componentFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get testFiles () {
    return this.resolvedConfig.testFiles ? new ResolvedOption(this.resolvedConfig.testFiles) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get userAgent () {
    return this.resolvedConfig.userAgent ? new ResolvedOption(this.resolvedConfig.userAgent) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get supportFolder () {
    return this.resolvedConfig.supportFolder ? new ResolvedOption(this.resolvedConfig.supportFolder) : null
  }

  @nxs.field.type(() => ResolvedOption)
  get experimentalFetchPolyfill () {
    return this.resolvedConfig.experimentalFetchPolyfill ? new ResolvedOption(this.resolvedConfig.experimentalFetchPolyfill) : null
  }

}

