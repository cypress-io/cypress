import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderFailure, renderKnownFailure, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const TAP_SPECS_OPERATION = {
  operationName: 'TapSpecs',
  query: 'query TapSpecs { currentProject { specs { relative gitInfo { lastModifiedHumanReadable lastModifiedTimestamp } } } }',
}

interface TapSpecEntry {
  relativePath: string
  lastModified?: string
  lastModifiedTimestamp?: string
}

interface SpecGitInfo {
  lastModifiedHumanReadable?: unknown
  lastModifiedTimestamp?: unknown
}

interface TapSpecsData {
  currentProject?: {
    specs?: Array<{
      relative?: unknown
      gitInfo?: SpecGitInfo | null
    } | null>
  } | null
}

const toSpecList = (data: TapSpecsData): TapSpecEntry[] => {
  const specs = Array.isArray(data.currentProject?.specs) ? data.currentProject.specs : []

  return specs
    .filter((spec): spec is { relative: string, gitInfo?: SpecGitInfo | null } => typeof spec?.relative === 'string')
    .map((spec) => {
      // `lastModified` is git's human-readable time (e.g. "3 days ago");
      // `lastModifiedTimestamp` is the raw commit time. Both absent for
      // untracked specs.
      const lastModified = spec.gitInfo?.lastModifiedHumanReadable
      const lastModifiedTimestamp = spec.gitInfo?.lastModifiedTimestamp

      return {
        relativePath: spec.relative,
        ...(typeof lastModified === 'string' ? { lastModified } : {}),
        ...(typeof lastModifiedTimestamp === 'string' ? { lastModifiedTimestamp } : {}),
      }
    })
}

const listSpecs = async (options: TapCliOptions): Promise<number> => {
  try {
    const { instance } = await resolveLiveInstance({ instance: options.instance, cwd: process.cwd() })
    const data = await queryInstanceGraphql<TapSpecsData>(instance, TAP_SPECS_OPERATION)

    renderResult(toSpecList(data))

    return 0
  } catch (err: any) {
    if (err instanceof CypressInstanceError) {
      renderFailure(err)

      return 1
    }

    if (err.known && err.details) {
      renderKnownFailure(err)

      return 1
    }

    throw err
  }
}

export const specsCommand = defineNativeCommand('specs', listSpecs)
