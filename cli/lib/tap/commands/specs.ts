import { CypressInstanceError, resolveLiveInstance } from '../../cypress-instances'
import { queryInstanceGraphql } from '../instance-gql'
import { renderFailure, renderKnownFailure, renderResult } from '../output'
import { defineNativeCommand } from './definition'
import type { TapCliOptions } from '../types'

const TAP_SPECS_OPERATION = {
  operationName: 'TapSpecs',
  query: 'query TapSpecs { currentProject { specs { relative } } }',
}

interface TapSpecsData {
  currentProject?: { specs?: Array<{ relative?: unknown } | null> } | null
}

const toSpecList = (data: TapSpecsData): Array<{ relativePath: string }> => {
  const specs = Array.isArray(data.currentProject?.specs) ? data.currentProject.specs : []

  return specs
    .map((spec) => spec?.relative)
    .filter((relative): relative is string => typeof relative === 'string')
    .map((relative) => ({ relativePath: relative }))
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
