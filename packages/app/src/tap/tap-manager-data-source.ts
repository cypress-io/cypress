import { gql } from '@urql/vue'
import type { Client } from '@urql/core'
import type { FoundSpec } from '@packages/types'

import { TapSpecsDocument } from '../generated/graphql'
import type { RunnableSpec, TapTestsRunner } from './types'

gql`
query TapSpecs {
  currentProject {
    id
    specs {
      id
      relative
      specType
    }
  }
}
`

export const tapManagerDataSource = {
  getRunner (): TapTestsRunner | undefined {
    try {
      // Both a throw and undefined here mean there is no run to read yet.
      const eventManager = window.getEventManager?.()
      const runner = eventManager?.getCypress()?.runner

      if (!eventManager || !runner) {
        return undefined
      }

      return {
        getAllTestsState: runner.getAllTestsState,
        getTestState: runner.getTestState,
        isRunComplete: () => eventManager.runComplete,
      }
    } catch {
      return undefined
    }
  },

  getActiveSpecRelative (): string | undefined {
    try {
      return window.getEventManager?.().getCypress()?.spec?.relative
    } catch {
      return undefined
    }
  },

  async getRunnableSpecs (gqlClient: Client | null): Promise<RunnableSpec[]> {
    if (gqlClient) {
      const result = await gqlClient.query(TapSpecsDocument, {}, { requestPolicy: 'network-only' }).toPromise()
      const specs = result.data?.currentProject?.specs

      if (specs) {
        return specs.map(({ relative, specType }) => ({ relative, specType }))
      }
    }

    return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
  },

  getHash () {
    return window.location.hash
  },

  setHash (hash: string) {
    window.location.hash = hash
  },
}
