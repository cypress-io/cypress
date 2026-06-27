import type { RouteMatcherOptions } from './external-types'
import type { BackendStaticResponse } from './internal-types'

export type GetFixtureFn = (path: string, opts?: { encoding?: string | null }) => Promise<any>

export interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  id: string
  hasInterceptor: boolean
  staticResponse?: BackendStaticResponse
  getFixture: GetFixtureFn
  matches: number
  disabled?: boolean
  /**
   * Explicit `log` option from the route matcher. When `false`, matching requests
   * are not logged or snapshotted, even for spied (non-stubbed) intercepts.
   */
  log?: boolean
}
