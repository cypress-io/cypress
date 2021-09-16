import type { FoundSpec } from '@packages/server/lib/util/specs'

export interface SpecContract extends FoundSpec {
  specType: Cypress.CypressSpecType
}
