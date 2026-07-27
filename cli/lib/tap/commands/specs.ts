import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import { TapSpecsOperation } from '@packages/cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderFailure, renderKnownFailure, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapSpecsQuery } from '@packages/cypress-instances'
import type { TapCliOptions } from '../types'

interface TapSpecEntry {
  relativePath: string
  lastModified?: string
  lastModifiedTimestamp?: string
}

// `TapSpecsQuery` is the schema shape, but the value crosses the wire unvalidated,
// so entries are guarded against nulls and non-string fields before rendering.
const toSpecList = (data: TapSpecsQuery): TapSpecEntry[] => {
  const specs = data.currentProject?.specs ?? []

  return specs
    .filter((spec) => typeof spec?.relative === 'string')
    .map((spec) => {
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
    const data = await queryInstanceGraphql(instance, TapSpecsOperation)

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
