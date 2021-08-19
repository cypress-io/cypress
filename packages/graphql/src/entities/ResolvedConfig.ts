import { enumType } from 'nexus'
import { nxs, NxsResult } from 'nexus-decorators'
import Debug from 'debug'
import type { ResolvedConfigurationOptions, ResolvedFromConfig } from '@packages/server/lib/config'

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
export class ResolvedConfig {
  constructor (private resolvedConfig: ResolvedConfigurationOptions) {
    debug('Created new ResolvedConfig %o', resolvedConfig)
  }

  @nxs.field.type(() => ResolvedStringOption)
  get baseUrl (): NxsResult<'ResolvedConfig', 'baseUrl'> {
    return this.resolvedConfig.baseUrl ? new ResolvedStringOption(this.resolvedConfig.baseUrl) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get projectId (): NxsResult<'ResolvedConfig', 'projectId'> {
    return this.resolvedConfig.projectId ? new ResolvedStringOption(this.resolvedConfig.projectId) : null
  }

  @nxs.field.type(() => ResolvedJsonOption)
  get env (): NxsResult<'ResolvedConfig', 'env'> {
    return this.resolvedConfig.env ? new ResolvedJsonOption(this.resolvedConfig.env) : null
  }

  @nxs.field.type(() => ResolvedStringListOption)
  get ignoreTestFiles (): NxsResult<'ResolvedConfig', 'ignoreTestFiles'> {
    return this.resolvedConfig.ignoreTestFiles ? new ResolvedStringListOption(this.resolvedConfig.ignoreTestFiles) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get numTestsKeptInMemory (): NxsResult<'ResolvedConfig', 'numTestsKeptInMemory'> {
    return this.resolvedConfig.numTestsKeptInMemory ? new ResolvedNumberOption(this.resolvedConfig.numTestsKeptInMemory) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get port (): NxsResult<'ResolvedConfig', 'port'> {
    return this.resolvedConfig.port ? new ResolvedNumberOption(this.resolvedConfig.port) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get reporter (): NxsResult<'ResolvedConfig', 'reporter'> {
    return this.resolvedConfig.reporter ? new ResolvedStringOption(this.resolvedConfig.reporter) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get watchForFileChanges (): NxsResult<'ResolvedConfig', 'watchForFileChanges'> {
    return this.resolvedConfig.watchForFileChanges ? new ResolvedBooleanOption(this.resolvedConfig.watchForFileChanges) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get defaultCommandTimeout (): NxsResult<'ResolvedConfig', 'defaultCommandTimeout'> {
    return this.resolvedConfig.defaultCommandTimeout ? new ResolvedNumberOption(this.resolvedConfig.defaultCommandTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get execTimeout (): NxsResult<'ResolvedConfig', 'execTimeout'> {
    return this.resolvedConfig.execTimeout ? new ResolvedNumberOption(this.resolvedConfig.execTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get pageLoadTimeout (): NxsResult<'ResolvedConfig', 'pageLoadTimeout'> {
    return this.resolvedConfig.pageLoadTimeout ? new ResolvedNumberOption(this.resolvedConfig.pageLoadTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get requestTimeout (): NxsResult<'ResolvedConfig', 'requestTimeout'> {
    return this.resolvedConfig.requestTimeout ? new ResolvedNumberOption(this.resolvedConfig.requestTimeout) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get taskTimeout (): NxsResult<'ResolvedConfig', 'taskTimeout'> {
    return this.resolvedConfig.taskTimeout ? new ResolvedNumberOption(this.resolvedConfig.taskTimeout) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get fileServerFolder (): NxsResult<'ResolvedConfig', 'fileServerFolder'> {
    return this.resolvedConfig.fileServerFolder ? new ResolvedStringOption(this.resolvedConfig.fileServerFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get fixturesFolder (): NxsResult<'ResolvedConfig', 'fixturesFolder'> {
    return this.resolvedConfig.fixturesFolder ? new ResolvedStringOption(this.resolvedConfig.fixturesFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get integrationFolder (): NxsResult<'ResolvedConfig', 'integrationFolder'> {
    return this.resolvedConfig.integrationFolder ? new ResolvedStringOption(this.resolvedConfig.integrationFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get downloadsFolder (): NxsResult<'ResolvedConfig', 'downloadsFolder'> {
    return this.resolvedConfig.downloadsFolder ? new ResolvedStringOption(this.resolvedConfig.downloadsFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get nodeVersion (): NxsResult<'ResolvedConfig', 'nodeVersion'> {
    return this.resolvedConfig.nodeVersion ? new ResolvedStringOption(this.resolvedConfig.nodeVersion) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get pluginsFile (): NxsResult<'ResolvedConfig', 'pluginsFile'> {
    return this.resolvedConfig.pluginsFile ? new ResolvedStringOption(this.resolvedConfig.pluginsFile) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get redirectionLimit (): NxsResult<'ResolvedConfig', 'redirectionLimit'> {
    return this.resolvedConfig.redirectionLimit ? new ResolvedNumberOption(this.resolvedConfig.redirectionLimit) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get resolvedNodePath (): NxsResult<'ResolvedConfig', 'resolvedNodePath'> {
    return this.resolvedConfig.resolvedNodePath ? new ResolvedStringOption(this.resolvedConfig.resolvedNodePath) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get resolvedNodeVersion (): NxsResult<'ResolvedConfig', 'resolvedNodeVersion'> {
    return this.resolvedConfig.resolvedNodeVersion ? new ResolvedStringOption(this.resolvedConfig.resolvedNodeVersion) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get screenshotOnRunFailure (): NxsResult<'ResolvedConfig', 'screenshotOnRunFailure'> {
    return this.resolvedConfig.screenshotOnRunFailure ? new ResolvedBooleanOption(this.resolvedConfig.screenshotOnRunFailure) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get screenshotsFolder (): NxsResult<'ResolvedConfig', 'screenshotsFolder'> {
    return this.resolvedConfig.screenshotsFolder ? new ResolvedStringOption(this.resolvedConfig.screenshotsFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get supportFile (): NxsResult<'ResolvedConfig', 'supportFile'> {
    return this.resolvedConfig.supportFile ? new ResolvedStringOption(this.resolvedConfig.supportFile) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get videosFolder (): NxsResult<'ResolvedConfig', 'videosFolder'> {
    return this.resolvedConfig.videosFolder ? new ResolvedStringOption(this.resolvedConfig.videosFolder) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get trashAssetsBeforeRuns (): NxsResult<'ResolvedConfig', 'trashAssetsBeforeRuns'> {
    return this.resolvedConfig.trashAssetsBeforeRuns ? new ResolvedBooleanOption(this.resolvedConfig.trashAssetsBeforeRuns) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get videoCompression (): NxsResult<'ResolvedConfig', 'videoCompression'> {
    return this.resolvedConfig.videoCompression ? new ResolvedNumberOption(this.resolvedConfig.videoCompression) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get video (): NxsResult<'ResolvedConfig', 'video'> {
    return this.resolvedConfig.video ? new ResolvedBooleanOption(this.resolvedConfig.video) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get videoUploadOnPasses (): NxsResult<'ResolvedConfig', 'videoUploadOnPasses'> {
    return this.resolvedConfig.videoUploadOnPasses ? new ResolvedBooleanOption(this.resolvedConfig.videoUploadOnPasses) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get chromeWebSecurity (): NxsResult<'ResolvedConfig', 'chromeWebSecurity'> {
    return this.resolvedConfig.chromeWebSecurity ? new ResolvedBooleanOption(this.resolvedConfig.chromeWebSecurity) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get viewportHeight (): NxsResult<'ResolvedConfig', 'viewportHeight'> {
    return this.resolvedConfig.viewportHeight ? new ResolvedNumberOption(this.resolvedConfig.viewportHeight) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get viewportWidth (): NxsResult<'ResolvedConfig', 'viewportWidth'> {
    return this.resolvedConfig.viewportWidth ? new ResolvedNumberOption(this.resolvedConfig.viewportWidth) : null
  }

  @nxs.field.type(() => ResolvedNumberOption)
  get animationDistanceThreshold (): NxsResult<'ResolvedConfig', 'animationDistanceThreshold'> {
    return this.resolvedConfig.animationDistanceThreshold ? new ResolvedNumberOption(this.resolvedConfig.animationDistanceThreshold) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get waitForAnimations (): NxsResult<'ResolvedConfig', 'waitForAnimations'> {
    return this.resolvedConfig.waitForAnimations ? new ResolvedBooleanOption(this.resolvedConfig.waitForAnimations) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get scrollBehavior (): NxsResult<'ResolvedConfig', 'scrollBehavior'> {
    return this.resolvedConfig.scrollBehavior ? new ResolvedStringOption(this.resolvedConfig.scrollBehavior) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalSessionSupport (): NxsResult<'ResolvedConfig', 'experimentalSessionSupport'> {
    return this.resolvedConfig.experimentalSessionSupport ? new ResolvedBooleanOption(this.resolvedConfig.experimentalSessionSupport) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalInteractiveRunEvents (): NxsResult<'ResolvedConfig', 'experimentalInteractiveRunEvents'> {
    return this.resolvedConfig.experimentalInteractiveRunEvents ? new ResolvedBooleanOption(this.resolvedConfig.experimentalInteractiveRunEvents) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalSourceRewriting (): NxsResult<'ResolvedConfig', 'experimentalSourceRewriting'> {
    return this.resolvedConfig.experimentalSourceRewriting ? new ResolvedBooleanOption(this.resolvedConfig.experimentalSourceRewriting) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get experimentalStudio (): NxsResult<'ResolvedConfig', 'experimentalStudio'> {
    return this.resolvedConfig.experimentalStudio ? new ResolvedBooleanOption(this.resolvedConfig.experimentalStudio) : null
  }

  // TODO - how to represent this
  @nxs.field.type(() => ResolvedNumberOption)
  get retries (): NxsResult<'ResolvedConfig', 'retries'> {
    return this.resolvedConfig.retries ? new ResolvedNumberOption(this.resolvedConfig.retries) : null
  }

  @nxs.field.type(() => ResolvedBooleanOption)
  get includeShadowDom (): NxsResult<'ResolvedConfig', 'includeShadowDom'> {
    return this.resolvedConfig.includeShadowDom ? new ResolvedBooleanOption(this.resolvedConfig.includeShadowDom) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get blockHosts (): NxsResult<'ResolvedConfig', 'blockHosts'> {
    return this.resolvedConfig.blockHosts ? new ResolvedStringOption(this.resolvedConfig.blockHosts) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get componentFolder (): NxsResult<'ResolvedConfig', 'componentFolder'> {
    return this.resolvedConfig.componentFolder ? new ResolvedStringOption(this.resolvedConfig.componentFolder) : null
  }

  @nxs.field.type(() => ResolvedStringOption)
  get testFiles (): NxsResult<'ResolvedConfig', 'testFiles'> {
    return this.resolvedConfig.testFiles ? new ResolvedStringOption(this.resolvedConfig.testFiles) : null
  }

  @nxs.field.type((): NxsResult<'ResolvedConfig', 'nxs'> => ResolvedStringOption)
  get userAgent (): NxsResult<'ResolvedConfig', 'userAgent'> {
    return this.resolvedConfig.userAgent ? new ResolvedStringOption(this.resolvedConfig.userAgent) : null
  }

  @nxs.field.type((): NxsResult<'ResolvedConfig', 'nxs'> => ResolvedOptionBase)
  get supportFolder (): NxsResult<'ResolvedConfig', 'supportFolder'> {
    return this.resolvedConfig.supportFolder ? new ResolvedStringOption(this.resolvedConfig.supportFolder) : null
  }

  @nxs.field.type((): NxsResult<'ResolvedConfig', 'nxs'> => ResolvedBooleanOption)
  get experimentalFetchPolyfill (): NxsResult<'ResolvedConfig', 'experimentalFetchPolyfill'> {
    return this.resolvedConfig.experimentalFetchPolyfill ? new ResolvedBooleanOption(this.resolvedConfig.experimentalFetchPolyfill) : null
  }
}
