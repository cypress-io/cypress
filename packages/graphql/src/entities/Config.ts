import { enumType } from 'nexus'
import { nxs, NxsResult } from 'nexus-decorators'
import Debug from 'debug'
import type { FullConfiguration, ResolvedFromConfig } from '@packages/server/lib/config'

const debug = Debug('cypress:graphql:resolved-config')

const ResolvedConfigOptionEnum = enumType({
  name: 'ResolvedConfigOption',
  members: ['plugin', 'env', 'default', 'runtime', 'config'] as const,
})

const RESOLVED_TYPE = ['array', 'string', 'json', 'boolean', 'number'] as const

type ResolvedType = typeof RESOLVED_TYPE[number]

const ResolvedTypeEnum = enumType({
  name: 'ResolvedType',
  members: RESOLVED_TYPE,
})

@nxs.objectType()
export abstract class ResolvedOptionBase {
  constructor (protected resolveFromConfig: ResolvedFromConfig) {}

  abstract get type (): ResolvedType

  @nxs.field.type(() => ResolvedConfigOptionEnum)
  get from (): ResolvedFromConfig['from'] {
    return this.resolveFromConfig.from
  }
}

@nxs.objectType()
export class ResolvedStringOption extends ResolvedOptionBase {
  @nxs.field.nonNull.type(() => ResolvedTypeEnum)
  get type (): ResolvedType {
    return 'string'
  }

  @nxs.field.string()
  get value (): NxsResult<'ResolvedStringOption', 'value'> {
    return this.resolveFromConfig.value
  }
}

@nxs.objectType()
export class ResolvedStringListOption extends ResolvedOptionBase {
  @nxs.field.nonNull.type(() => ResolvedTypeEnum)
  get type (): ResolvedType {
    return 'array'
  }

  @nxs.field.list.string()
  get value (): NxsResult<'ResolvedStringListOption', 'value'> {
    if (!this.resolveFromConfig.value) {
      return null
    }

    if (Array.isArray(this.resolveFromConfig.value)) {
      return this.resolveFromConfig.value
    }

    return [this.resolveFromConfig.value]
  }
}

@nxs.objectType()
export class ResolvedNumberOption extends ResolvedOptionBase {
  @nxs.field.nonNull.type(() => ResolvedTypeEnum)
  get type (): ResolvedType {
    return 'number'
  }

  @nxs.field.string()
  get value (): NxsResult<'ResolvedNumberOption', 'value'> {
    return this.resolveFromConfig.value
  }
}

@nxs.objectType()
export class ResolvedBooleanOption extends ResolvedOptionBase {
  @nxs.field.nonNull.type(() => ResolvedTypeEnum)
  get type (): ResolvedType {
    return 'boolean'
  }

  @nxs.field.boolean()
  get value (): NxsResult<'ResolvedBooleanOption', 'value'> {
    return this.resolveFromConfig.value
  }
}

@nxs.objectType({
  description: 'An JSON object represented as a string via JSON.stringify. Useful for representing complex types like `env`',
})
export class ResolvedJsonOption extends ResolvedOptionBase {
  @nxs.field.nonNull.type(() => ResolvedTypeEnum)
  get type (): ResolvedType {
    return 'json'
  }

  @nxs.field.string()
  get value (): NxsResult<'ResolvedJsonOption', 'value'> {
    return JSON.stringify(this.resolveFromConfig.value)
  }
}

@nxs.objectType({
  description: 'Resolve config for a project',
})
export class Config {
  constructor (private config: FullConfiguration) {
    debug('Created new config %o', config)
  }

  get rawConfig (): FullConfiguration {
    return this.config
  }

  @nxs.field.type(() => ResolvedStringOption)
  get baseUrl (): NxsResult<'Config', 'baseUrl'> {
    return this.config.resolved.baseUrl ? new ResolvedStringOption(this.config.resolved.baseUrl) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get projectId (): NxsResult<'Config', 'projectId'> {
    return this.config.resolved.projectId ? new ResolvedStringOption(this.config.resolved.projectId) : null
  }

  @nxs.field.type(() => ResolvedJsonOption)
  get env (): NxsResult<'Config', 'env'> {
    return this.config.resolved.env ? new ResolvedJsonOption(this.config.resolved.env) : null
  }

  @nxs.field.type(() => ResolvedStringListOption)
  get ignoreTestFiles (): NxsResult<'Config', 'ignoreTestFiles'> {
    return this.config.resolved.ignoreTestFiles ? new ResolvedStringListOption(this.config.resolved.ignoreTestFiles) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get numTestsKeptInMemory (): NxsResult<'Config', 'numTestsKeptInMemory'> {
    return this.config.resolved.numTestsKeptInMemory ? new ResolvedNumberOption(this.config.resolved.numTestsKeptInMemory) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get port (): NxsResult<'Config', 'port'> {
    return this.config.resolved.port ? new ResolvedNumberOption(this.config.resolved.port) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get reporter (): NxsResult<'Config', 'reporter'> {
    return this.config.resolved.reporter ? new ResolvedStringOption(this.config.resolved.reporter) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get watchForFileChanges (): NxsResult<'Config', 'watchForFileChanges'> {
    return this.config.resolved.watchForFileChanges ? new ResolvedBooleanOption(this.config.resolved.watchForFileChanges) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get defaultCommandTimeout (): NxsResult<'Config', 'defaultCommandTimeout'> {
    return this.config.resolved.defaultCommandTimeout ? new ResolvedNumberOption(this.config.resolved.defaultCommandTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get execTimeout (): NxsResult<'Config', 'execTimeout'> {
    return this.config.resolved.execTimeout ? new ResolvedNumberOption(this.config.resolved.execTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get pageLoadTimeout (): NxsResult<'Config', 'pageLoadTimeout'> {
    return this.config.resolved.pageLoadTimeout ? new ResolvedNumberOption(this.config.resolved.pageLoadTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get requestTimeout (): NxsResult<'Config', 'requestTimeout'> {
    return this.config.resolved.requestTimeout ? new ResolvedNumberOption(this.config.resolved.requestTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get taskTimeout (): NxsResult<'Config', 'taskTimeout'> {
    return this.config.resolved.taskTimeout ? new ResolvedNumberOption(this.config.resolved.taskTimeout) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get fileServerFolder (): NxsResult<'Config', 'fileServerFolder'> {
    return this.config.resolved.fileServerFolder ? new ResolvedStringOption(this.config.resolved.fileServerFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get fixturesFolder (): NxsResult<'Config', 'fixturesFolder'> {
    return this.config.resolved.fixturesFolder ? new ResolvedStringOption(this.config.resolved.fixturesFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get integrationFolder (): NxsResult<'Config', 'integrationFolder'> {
    return this.config.resolved.integrationFolder ? new ResolvedStringOption(this.config.resolved.integrationFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get downloadsFolder (): NxsResult<'Config', 'downloadsFolder'> {
    return this.config.resolved.downloadsFolder ? new ResolvedStringOption(this.config.resolved.downloadsFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get nodeVersion (): NxsResult<'Config', 'nodeVersion'> {
    return this.config.resolved.nodeVersion ? new ResolvedStringOption(this.config.resolved.nodeVersion) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get pluginsFile (): NxsResult<'Config', 'pluginsFile'> {
    return this.config.resolved.pluginsFile ? new ResolvedStringOption(this.config.resolved.pluginsFile) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get redirectionLimit (): NxsResult<'Config', 'redirectionLimit'> {
    return this.config.resolved.redirectionLimit ? new ResolvedNumberOption(this.config.resolved.redirectionLimit) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get resolvedNodePath (): NxsResult<'Config', 'resolvedNodePath'> {
    return this.config.resolved.resolvedNodePath ? new ResolvedStringOption(this.config.resolved.resolvedNodePath) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get resolvedNodeVersion (): NxsResult<'Config', 'resolvedNodeVersion'> {
    return this.config.resolved.resolvedNodeVersion ? new ResolvedStringOption(this.config.resolved.resolvedNodeVersion) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get screenshotOnRunFailure (): NxsResult<'Config', 'screenshotOnRunFailure'> {
    return this.config.resolved.screenshotOnRunFailure ? new ResolvedBooleanOption(this.config.resolved.screenshotOnRunFailure) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get screenshotsFolder (): NxsResult<'Config', 'screenshotsFolder'> {
    return this.config.resolved.screenshotsFolder ? new ResolvedStringOption(this.config.resolved.screenshotsFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get supportFile (): NxsResult<'Config', 'supportFile'> {
    return this.config.resolved.supportFile ? new ResolvedStringOption(this.config.resolved.supportFile) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get videosFolder (): NxsResult<'Config', 'videosFolder'> {
    return this.config.resolved.videosFolder ? new ResolvedStringOption(this.config.resolved.videosFolder) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get trashAssetsBeforeRuns (): NxsResult<'Config', 'trashAssetsBeforeRuns'> {
    return this.config.resolved.trashAssetsBeforeRuns ? new ResolvedBooleanOption(this.config.resolved.trashAssetsBeforeRuns) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get videoCompression (): NxsResult<'Config', 'videoCompression'> {
    return this.config.resolved.videoCompression ? new ResolvedNumberOption(this.config.resolved.videoCompression) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get video (): NxsResult<'Config', 'video'> {
    return this.config.resolved.video ? new ResolvedBooleanOption(this.config.resolved.video) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get videoUploadOnPasses (): NxsResult<'Config', 'videoUploadOnPasses'> {
    return this.config.resolved.videoUploadOnPasses ? new ResolvedBooleanOption(this.config.resolved.videoUploadOnPasses) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get chromeWebSecurity (): NxsResult<'Config', 'chromeWebSecurity'> {
    return this.config.resolved.chromeWebSecurity ? new ResolvedBooleanOption(this.config.resolved.chromeWebSecurity) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get viewportHeight (): NxsResult<'Config', 'viewportHeight'> {
    return this.config.resolved.viewportHeight ? new ResolvedNumberOption(this.config.resolved.viewportHeight) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get viewportWidth (): NxsResult<'Config', 'viewportWidth'> {
    return this.config.resolved.viewportWidth ? new ResolvedNumberOption(this.config.resolved.viewportWidth) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get animationDistanceThreshold (): NxsResult<'Config', 'animationDistanceThreshold'> {
    return this.config.resolved.animationDistanceThreshold ? new ResolvedNumberOption(this.config.resolved.animationDistanceThreshold) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get waitForAnimations (): NxsResult<'Config', 'waitForAnimations'> {
    return this.config.resolved.waitForAnimations ? new ResolvedBooleanOption(this.config.resolved.waitForAnimations) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get scrollBehavior (): NxsResult<'Config', 'scrollBehavior'> {
    return this.config.resolved.scrollBehavior ? new ResolvedStringOption(this.config.resolved.scrollBehavior) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalSessionSupport (): NxsResult<'Config', 'experimentalSessionSupport'> {
    return this.config.resolved.experimentalSessionSupport ? new ResolvedBooleanOption(this.config.resolved.experimentalSessionSupport) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalInteractiveRunEvents (): NxsResult<'Config', 'experimentalInteractiveRunEvents'> {
    return this.config.resolved.experimentalInteractiveRunEvents ? new ResolvedBooleanOption(this.config.resolved.experimentalInteractiveRunEvents) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalSourceRewriting (): NxsResult<'Config', 'experimentalSourceRewriting'> {
    return this.config.resolved.experimentalSourceRewriting ? new ResolvedBooleanOption(this.config.resolved.experimentalSourceRewriting) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalStudio (): NxsResult<'Config', 'experimentalStudio'> {
    return this.config.resolved.experimentalStudio ? new ResolvedBooleanOption(this.config.resolved.experimentalStudio) : null
  }

  // TODO - how to represent this
  @nxs.field.type(() => ResolvedNumberOption)
  get retries (): NxsResult<'Config', 'retries'> {
    return this.config.resolved.retries ? new ResolvedNumberOption(this.config.resolved.retries) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get includeShadowDom (): NxsResult<'Config', 'includeShadowDom'> {
    return this.config.resolved.includeShadowDom ? new ResolvedBooleanOption(this.config.resolved.includeShadowDom) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get blockHosts (): NxsResult<'Config', 'blockHosts'> {
    return this.config.resolved.blockHosts ? new ResolvedStringOption(this.config.resolved.blockHosts) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get componentFolder (): NxsResult<'Config', 'componentFolder'> {
    return this.config.resolved.componentFolder ? new ResolvedStringOption(this.config.resolved.componentFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get testFiles (): NxsResult<'Config', 'testFiles'> {
    return this.config.resolved.testFiles ? new ResolvedStringOption(this.config.resolved.testFiles) : null
  }

  @nxs.field.type((): NxsResult<'Config', 'nxs'> => ResolvedStringOption)
  get userAgent (): NxsResult<'Config', 'userAgent'> {
    return this.config.resolved.userAgent ? new ResolvedStringOption(this.config.resolved.userAgent) : null
  }

  @nxs.field.type((): NxsResult<'Config', 'nxs'> => ResolvedStringOption)
  get supportFolder (): NxsResult<'Config', 'supportFolder'> {
    return this.config.resolved.supportFolder ? new ResolvedStringOption(this.config.resolved.supportFolder) : null
  }

  @nxs.field.type((): NxsResult<'Config', 'nxs'> => ResolvedBooleanOption)
  get experimentalFetchPolyfill (): NxsResult<'Config', 'experimentalFetchPolyfill'> {
    return this.config.resolved.experimentalFetchPolyfill ? new ResolvedBooleanOption(this.config.resolved.experimentalFetchPolyfill) : null
  }
}
