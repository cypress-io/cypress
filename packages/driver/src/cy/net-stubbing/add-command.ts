import _ from 'lodash'

import {
  RouteHandler,
  RouteMatcherOptions,
  RouteMatcher,
  StaticResponse,
  HttpRequestInterceptor,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
  AnnotatedRouteMatcherOptions,
  AnnotatedStringMatcher,
  NetEventFrames,
  StringMatcher,
  NumberMatcher,
} from '@packages/net-stubbing/lib/types'
import {
  validateStaticResponse,
  getBackendStaticResponse,
  hasStaticResponseKeys,
} from './static-response-utils'
import { registerEvents } from './events'
import $errUtils from '../../cypress/error_utils'
import $utils from '../../cypress/utils'

const lowercaseFieldNames = (headers: { [fieldName: string]: any }) => _.mapKeys(headers, (v, k) => _.toLower(k))

/**
 * Get all STRING_MATCHER_FIELDS paths plus any extra fields the user has added within
 * DICT_STRING_MATCHER_FIELDS objects
 */
function getAllStringMatcherFields (options: RouteMatcherOptions): string[] {
  // add the nested DictStringMatcher values to the list of fields to annotate
  return _.chain(DICT_STRING_MATCHER_FIELDS)
  .map((field): string[] | string => {
    const value = options[field]

    if (value) {
      // if this DICT_STRING_MATCHER is set, return a list of the prop paths
      return _.keys(value).map((key) => {
        return `${field}.${key}`
      })
    }

    return ''
  })
  .compact()
  .flatten()
  .concat(STRING_MATCHER_FIELDS)
  .value()
}

/**
 * Annotate non-primitive types so that they can be passed to the backend and re-hydrated.
 */
function annotateMatcherOptionsTypes (options: RouteMatcherOptions) {
  const ret: AnnotatedRouteMatcherOptions = {}

  getAllStringMatcherFields(options).forEach((field) => {
    const value = _.get(options, field)

    if (value) {
      _.set(ret, field, {
        type: (isRegExp(value)) ? 'regex' : 'glob',
        value: value.toString(),
      } as AnnotatedStringMatcher)
    }
  })

  const noAnnotationRequiredFields = ['https', 'port', 'webSocket']

  _.extend(ret, _.pick(options, noAnnotationRequiredFields))

  return ret
}

function getUniqueId () {
  return `${Number(new Date()).toString()}-${_.uniqueId()}`
}

function isHttpRequestInterceptor (obj): obj is HttpRequestInterceptor {
  return typeof obj === 'function'
}

function isRegExp (obj): obj is RegExp {
  return obj && (obj instanceof RegExp || obj.__proto__ === RegExp.prototype || obj.__proto__.constructor.name === 'RegExp')
}

function isStringMatcher (obj): obj is StringMatcher {
  return isRegExp(obj) || _.isString(obj)
}

function isNumberMatcher (obj): obj is NumberMatcher {
  return Array.isArray(obj) ? _.every(obj, _.isNumber) : _.isNumber(obj)
}

function validateRouteMatcherOptions (routeMatcher: RouteMatcherOptions): { isValid: boolean, message?: string } {
  const err = (message) => {
    return { isValid: false, message }
  }

  if (_.isEmpty(routeMatcher)) {
    return err('The RouteMatcher does not contain any keys. You must pass something to match on.')
  }

  const stringMatcherFields = getAllStringMatcherFields(routeMatcher)

  for (const path of stringMatcherFields) {
    const v = _.get(routeMatcher, path)

    if (_.has(routeMatcher, path) && !isStringMatcher(v)) {
      return err(`\`${path}\` must be a string or a regular expression.`)
    }
  }

  if (_.has(routeMatcher, 'https') && !_.isBoolean(routeMatcher.https)) {
    return err('`https` must be a boolean.')
  }

  if (_.has(routeMatcher, 'port') && !isNumberMatcher(routeMatcher.port)) {
    return err('`port` must be a number or a list of numbers.')
  }

  if (_.has(routeMatcher, 'headers')) {
    const knownFieldNames: string[] = []

    for (const k in routeMatcher.headers) {
      if (knownFieldNames.includes(k.toLowerCase())) {
        return err(`\`${k}\` was specified more than once in \`headers\`. Header fields can only be matched once (HTTP header field names are case-insensitive).`)
      }

      knownFieldNames.push(k)
    }
  }

  return { isValid: true }
}

export function addCommand (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: Cypress.State) {
  const { emitNetEvent } = registerEvents(Cypress)

  function getNewRouteLog (matcher: RouteMatcherOptions, isStubbed: boolean, alias: string | void, staticResponse?: StaticResponse) {
    let obj: Partial<Cypress.LogConfig> = {
      name: 'route',
      instrument: 'route',
      isStubbed,
      numResponses: 0,
      response: staticResponse ? (staticResponse.body || '< empty body >') : (isStubbed ? '< callback function >' : '< passthrough >'),
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

    ;['method', 'url'].forEach((k) => {
      if (matcher[k]) {
        obj[k] = String(matcher[k]) // stringify RegExp
      } else {
        obj[k] = '*'
      }
    })

    if (staticResponse) {
      if (staticResponse.statusCode) {
        obj.status = staticResponse.statusCode
      } else {
        obj.status = 200
      }

      if (staticResponse.body) {
        obj.response = staticResponse.body
      } else {
        obj.response = '<empty body>'
      }
    }

    if (!obj.response) {
      if (isStubbed) {
        obj.response = '<callback function'
      } else {
        obj.response = '<passthrough>'
      }
    }

    if (alias) {
      obj.alias = alias
    }

    return Cypress.log(obj)
  }

  function addRoute (matcher: RouteMatcherOptions, handler?: RouteHandler) {
    const handlerId = getUniqueId()

    const alias = cy.getNextAlias()

    let staticResponse: StaticResponse | undefined = undefined
    let hasInterceptor = false

    switch (true) {
      case isHttpRequestInterceptor(handler):
        hasInterceptor = true
        break
      case _.isUndefined(handler):
        // user is doing something like cy.intercept('foo').as('foo') to wait on a URL
        break
      case _.isString(handler):
        staticResponse = { body: <string>handler }
        break
      case _.isObjectLike(handler):
        if (!hasStaticResponseKeys(handler)) {
          // the user has not supplied any of the StaticResponse keys, assume it's a JSON object
          // that should become the body property
          handler = {
            body: handler,
          }
        }

        validateStaticResponse('cy.intercept', <StaticResponse>handler)

        staticResponse = handler as StaticResponse
        break
      default:
        return $errUtils.throwErrByPath('net_stubbing.intercept.invalid_handler', { args: { handler } })
    }

    const routeMatcher = annotateMatcherOptionsTypes(matcher)

    if (routeMatcher.headers) {
      // HTTP header names are case-insensitive, lowercase the matcher so it works as expected
      // @see https://github.com/cypress-io/cypress/issues/8921
      routeMatcher.headers = lowercaseFieldNames(routeMatcher.headers)
    }

    const frame: NetEventFrames.AddRoute = {
      handlerId,
      hasInterceptor,
      routeMatcher,
    }

    if (staticResponse) {
      frame.staticResponse = getBackendStaticResponse(staticResponse)
    }

    state('routes')[handlerId] = {
      log: getNewRouteLog(matcher, !!handler, alias, staticResponse),
      options: matcher,
      handler,
      hitCount: 0,
      requests: {},
    }

    if (alias) {
      state('routes')[handlerId].alias = alias
    }

    return emitNetEvent('route:added', frame)
  }

  function route2 (...args) {
    $errUtils.warnByPath('net_stubbing.route2_renamed')

    // @ts-ignore
    return intercept.apply(undefined, args)
  }

  function intercept (matcher: RouteMatcher, handler?: RouteHandler | StringMatcher, arg2?: RouteHandler) {
    function getMatcherOptions (): RouteMatcherOptions {
      if (_.isString(matcher) && $utils.isValidHttpMethod(matcher) && isStringMatcher(handler)) {
        // method, url, handler
        const url = handler as StringMatcher

        handler = arg2

        return {
          method: matcher,
          url,
        }
      }

      if (isStringMatcher(matcher)) {
        // url, handler
        return {
          url: matcher,
        }
      }

      return matcher
    }

    const routeMatcherOptions = getMatcherOptions()
    const { isValid, message } = validateRouteMatcherOptions(routeMatcherOptions)

    if (!isValid) {
      $errUtils.throwErrByPath('net_stubbing.intercept.invalid_route_matcher', { args: { message, matcher: routeMatcherOptions } })
    }

    return addRoute(routeMatcherOptions, handler as RouteHandler)
    .then(() => null)
  }

  Commands.addAll({
    intercept,
    route2,
  })
}
