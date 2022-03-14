import { options } from '@packages/config/lib/options'
import type { FilePartsShape } from '@packages/graphql/src/schemaTypes/objectTypes/gql-FileParts'
import type { FullConfig, ResolvedFromConfig, RESOLVED_FROM, TestingType } from '@packages/types'
import _ from 'lodash'
import minimatch from 'minimatch'

import type { DataContext } from '..'
import type { CurrentProjectDataSource } from './CurrentProjectDataSource'

/**
 * A fully "configured" project, meaning that we have the config.
 * Eliminates needing to make everything async to look it up
 */
export class ConfiguredProjectDataSource {
  constructor (
    private ctx: DataContext,
    private currentProject: CurrentProjectDataSource,
    private config: FullConfig & {testingType: TestingType},
  ) {}

  get specPatterns () {
    return {
      specPattern: _.toArray(this.config.specPattern),
      excludeSpecPattern: _.toArray(this.config.excludeSpecPattern),
    }
  }

  isDefaultSpecPattern () {
    const { e2e, component } = this.getDefaultSpecPatterns()

    const { specPattern } = this.specPatterns

    if (this.config.testingType === 'e2e') {
      return _.isEqual(specPattern, [e2e])
    }

    return _.isEqual(specPattern, [component])
  }

  matchesSpecPattern (specFile: string): boolean {
    const MINIMATCH_OPTIONS = { dot: true, matchBase: true }

    const { specPattern = [], excludeSpecPattern = [] } = this.specPatterns

    for (const pattern of excludeSpecPattern) {
      if (minimatch(specFile, pattern, MINIMATCH_OPTIONS)) {
        return false
      }
    }

    for (const pattern of specPattern) {
      if (minimatch(specFile, pattern, MINIMATCH_OPTIONS)) {
        return true
      }
    }

    return false
  }

  async getCodeGenCandidates (glob: string): Promise<FilePartsShape[]> {
    if (!glob.startsWith('**/')) {
      glob = `**/${glob}`
    }

    const projectRoot = this.ctx.currentProject

    if (!projectRoot) {
      throw Error(`Cannot find components without currentProject.`)
    }

    const codeGenCandidates = await this.ctx.file.getFilesByGlob(projectRoot, glob, { expandDirectories: true })

    return codeGenCandidates.map((absolute) => ({ absolute }))
  }

  private getDefaultSpecPatterns = () => {
    return {
      e2e: options.find((opt) => opt.name === 'e2e')?.defaultValue?.specPattern,
      component: options.find((opt) => opt.name === 'component')?.defaultValue?.specPattern,
    }
  }

  async getResolvedConfigFields (): Promise<ResolvedFromConfig[] | null> {
    interface ResolvedFromWithField extends ResolvedFromConfig {
      field: typeof RESOLVED_FROM[number]
    }

    const mapEnvResolvedConfigToObj = (config: ResolvedFromConfig): ResolvedFromWithField => {
      return Object.entries(config).reduce<ResolvedFromWithField>((acc, [field, value]) => {
        return {
          ...acc,
          value: { ...acc.value, [field]: value.value },
        }
      }, {
        value: {},
        field: 'env',
        from: 'env',
      })
    }

    return Object.entries(this.config).map(([key, value]) => {
      if (key === 'env' && value) {
        return mapEnvResolvedConfigToObj(value)
      }

      return { ...value, field: key }
    }) as ResolvedFromConfig[]
  }
}
