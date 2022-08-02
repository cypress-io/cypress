import _ from 'lodash'

import type {
  RouteMatcherOptions,
  StaticResponse,
} from '@packages/net-stubbing/lib/types'
import $utils from '../../cypress/utils'

// properties that, if they are the only ones set, make sense to display as the display url
const standaloneDisplayUrlProps: Array<keyof RouteMatcherOptions> = ['url', 'path', 'pathname']

export function getDisplayUrlMatcher (matcher: RouteMatcherOptions): string {
  const displayMatcher = _.omit(matcher, 'method')
  const displayMatcherKeys = _.keys(displayMatcher)

  for (const prop of standaloneDisplayUrlProps) {
    if (_.has(matcher, prop) && displayMatcherKeys.length === 1) {
      return String(matcher[prop])
    }
  }

  return $utils.stringify(displayMatcher)
}

export function getRouteMatcherLogConfig (matcher: RouteMatcherOptions, isStubbed: boolean, alias: string | void, staticResponse?: StaticResponse): Partial<Cypress.InternalLogConfig> {
  const obj: Partial<Cypress.InternalLogConfig> = {
    name: 'route',
    method: String(matcher.method || '*'),
    url: getDisplayUrlMatcher(matcher),
    instrument: 'route',
    isStubbed,
    numResponses: 0,
    consoleProps: () => {
      return {
        Method: obj.method,
        URL: obj.url,
        Status: obj.status,
        'Route Matcher': matcher,
        'Static Response': staticResponse,
        Alias: alias,
      }
    },
  }

  if (staticResponse) {
    if (staticResponse.statusCode) {
      obj.status = staticResponse.statusCode
    } else {
      obj.status = 200
    }

    if (staticResponse.body) {
      obj.response = String(staticResponse.body)
    } else {
      obj.response = '< empty body >'
    }
  }

  if (!obj.response) {
    if (isStubbed) {
      obj.response = '< callback function >'
    } else {
      obj.response = '< passthrough >'
    }
  }

  if (alias) {
    obj.alias = alias
  }

  return obj
}
