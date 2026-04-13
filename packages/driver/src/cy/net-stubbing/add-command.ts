import { pick, omit, getPath, setPath, hasPath, uniqueId } from '@packages/utils'

import {
  PLAIN_FIELDS,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
  RouteHandler,
  RouteMatcherOptions,
  RouteMatcher,
  StaticResponse,
  HttpRequestInterceptor,
  AnnotatedRouteMatcherOptions,
  AnnotatedStringMatcher,
  NetEvent,
  StringMatcher,
  NumberMatcher,
  BackendStaticResponseWithArrayBuffer,
  StaticResponseWithOptions,
} from '@packages/net-stubbing/lib/types'
import {
  validateStaticResponse,
  getBackendStaticResponse,
  hasStaticResponseWithOptionsKeys,
} from './static-response-utils'
import {
  getRouteMatcherLogConfig,
} from './route-matcher-log'
import { registerEvents } from './events'
import $errUtils from '../../cypress/error_utils'
import $utils from '../../cypress/utils'
import type { StateFunc } from '../../cypress/state'
import isValidDomain from 'is-valid-domain'
import isValidHostname from 'is-valid-hostname'

const lowercaseFieldNames = (headers: { [fieldName: string]: any }) => {
  const result: Record<string, any> = {}

  for (const k of Object.keys(headers)) {
    result[k.toLowerCase()] = headers[k]
  }

  return result
}

function hasOnlyRouteMatcherKeys (obj: any) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false

  const allFields = [...PLAIN_FIELDS, ...STRING_MATCHER_FIELDS, ...DICT_STRING_MATCHER_FIELDS]
  const remaining = omit(obj, allFields)

  return Object.keys(obj).length > 0 && Object.keys(remaining).length === 0
}

/**
 * Get all STRING_MATCHER_FIELDS paths plus any extra fields the user has added within
 * DICT_STRING_MATCHER_FIELDS objects
 */
function getAllStringMatcherFields (options: RouteMatcherOptions): string[] {
  // add the nested DictStringMatcher values to the list of fields to annotate
  const nested = DICT_STRING_MATCHER_FIELDS
  .map((field): string[] | string => {
    const value = options[field]

    if (value) {
      // if this DICT_STRING_MATCHER is set, return a list of the prop paths
      return Object.keys(value).map((key) => {
        return `${field}.${key}`
      })
    }

    return ''
  })
  .filter(Boolean)
  .flat()

  return [...nested, ...STRING_MATCHER_FIELDS]
}

/**
 * Annotate non-primitive types so that they can be passed to the backend and re-hydrated.
 */
function annotateMatcherOptionsTypes (options: RouteMatcherOptions) {
  const ret: AnnotatedRouteMatcherOptions = {}

  getAllStringMatcherFields(options).forEach((field) => {
    const value = getPath(options, field)

    if (value) {
      setPath(ret, field, {
        type: (isRegExp(value)) ? 'regex' : 'glob',
        value: value.toString(),
      } as AnnotatedStringMatcher)
    }
  })

  Object.assign(ret, pick(options, PLAIN_FIELDS))

  return ret
}

function getUniqueId () {
  return `${Number(new Date()).toString()}-${uniqueId()}`
}

function isHttpRequestInterceptor (obj): obj is HttpRequestInterceptor {
  return typeof obj === 'function'
}

function isRegExp (obj): obj is RegExp {
  return obj && (obj instanceof RegExp || obj.__proto__ === RegExp.prototype || obj.__proto__.constructor.name === 'RegExp')
}

function isStringMatcher (obj): obj is StringMatcher {
  return isRegExp(obj) || typeof obj === 'string'
}

function isNumberMatcher (obj): obj is NumberMatcher {
  return Array.isArray(obj) ? obj.every((v) => typeof v === 'number') : typeof obj === 'number'
}

const allRouteMatcherFields = [...PLAIN_FIELDS, ...STRING_MATCHER_FIELDS, ...DICT_STRING_MATCHER_FIELDS, 'auth']

function validateRouteMatcherOptions (routeMatcher: RouteMatcherOptions): { isValid: boolean, message?: string } {
  const err = (message) => {
    return { isValid: false, message }
  }

  if (!routeMatcher || Object.keys(routeMatcher).length === 0) {
    return err('The RouteMatcher does not contain any keys. You must pass something to match on.')
  }

  const stringMatcherFields = getAllStringMatcherFields(routeMatcher)

  for (const path of stringMatcherFields) {
    const v = getPath(routeMatcher, path)

    if (hasPath(routeMatcher, path) && !isStringMatcher(v)) {
      return err(`\`${path}\` must be a string or a regular expression.`)
    }
  }

  const booleanProps = ['https', 'middleware']

  for (const prop of booleanProps) {
    if (hasPath(routeMatcher, prop) && typeof routeMatcher[prop] !== 'boolean') {
      return err(`\`${prop}\` must be a boolean.`)
    }
  }

  if (typeof routeMatcher.hostname === 'string' && !(isValidHostname(routeMatcher.hostname) || isValidDomain(routeMatcher.hostname, { allowUnicode: true }))) {
    return err('`hostname` must be a valid host name or domain name.')
  }

  if (hasPath(routeMatcher, 'port') && !isNumberMatcher(routeMatcher.port)) {
    return err('`port` must be a number or a list of numbers.')
  }

  if (hasPath(routeMatcher, 'times') && (!Number.isInteger(routeMatcher.times) || Number(routeMatcher.times) <= 0)) {
    return err('`times` must be a positive integer.')
  }

  if (hasPath(routeMatcher, 'headers')) {
    const knownFieldNames: string[] = []

    for (const k in routeMatcher.headers) {
      if (knownFieldNames.includes(k.toLowerCase())) {
        return err(`\`${k}\` was specified more than once in \`headers\`. Header fields can only be matched once (HTTP header field names are case-insensitive).`)
      }

      knownFieldNames.push(k)
    }
  }

  for (const prop in routeMatcher) {
    if (!allRouteMatcherFields.includes(prop)) {
      return err(`An unknown \`RouteMatcher\` property was passed: \`${String(prop)}\`\n\nValid \`RouteMatcher\` properties are: ${allRouteMatcherFields.join(', ')}`)
    }
  }

  return { isValid: true }
}

export function addCommand (Commands, Cypress: Cypress.Cypress, cy: Cypress.cy, state: StateFunc) {
  const { emitNetEvent } = registerEvents(Cypress, cy)

  function addRoute (matcher: RouteMatcherOptions, handler?: RouteHandler) {
    const routeId = getUniqueId()

    const alias = cy.getNextAlias()

    let staticResponse: StaticResponse | undefined = undefined
    let hasInterceptor = false

    if (isHttpRequestInterceptor(handler)) {
      hasInterceptor = true
    } else if (typeof handler === 'string') {
      staticResponse = { body: handler }
    } else if (handler != null && typeof handler === 'object') {
      if (!hasStaticResponseWithOptionsKeys(handler)) {
        // the user has not supplied any of the StaticResponse keys, assume it's a JSON object
        // that should become the body property
        handler = {
          body: handler,
        }
      }

      validateStaticResponse('cy.intercept', <StaticResponseWithOptions>handler)

      staticResponse = handler as StaticResponseWithOptions
    } else if (handler !== undefined) {
      // a handler was passed but we dunno what it's supposed to be
      $errUtils.throwErrByPath('net_stubbing.intercept.invalid_handler', { args: { handler } })
    }

    const routeMatcher = annotateMatcherOptionsTypes(matcher)

    if (routeMatcher.headers) {
      // HTTP header names are case-insensitive, lowercase the matcher so it works as expected
      // @see https://github.com/cypress-io/cypress/issues/8921
      routeMatcher.headers = lowercaseFieldNames(routeMatcher.headers)
    }

    if (routeMatcher.middleware && !hasInterceptor) {
      $errUtils.throwErrByPath('net_stubbing.intercept.invalid_middleware_handler', { args: { handler } })
    }

    const frame: NetEvent.ToServer.AddRoute<BackendStaticResponseWithArrayBuffer> = {
      routeId,
      hasInterceptor,
      routeMatcher,
    }

    if (staticResponse) {
      frame.staticResponse = getBackendStaticResponse(staticResponse)
    }

    state('routes')[routeId] = {
      log: Cypress.log(getRouteMatcherLogConfig(matcher, !!handler, alias, staticResponse)),
      options: matcher,
      handler: handler!,
      hitCount: 0,
      requests: {},
      command: state('current'),
    }

    if (alias) {
      state('routes')[routeId].alias = alias
    }

    return emitNetEvent('route:added', frame)
  }

  function intercept (matcher: RouteMatcher, handler?: RouteHandler | StringMatcher | RouteMatcherOptions, arg2?: RouteHandler) {
    const checkExtraArguments = (overload: string[]) => {
      if (arguments.length > overload.length) {
        $errUtils.throwErrByPath('net_stubbing.intercept.extra_arguments', {
          args: {
            overload,
            argsLength: arguments.length,
          },
        })
      }
    }

    function getMatcherOptions (): RouteMatcherOptions {
      if (isStringMatcher(matcher) && hasOnlyRouteMatcherKeys(handler)) {
        // url, mergeRouteMatcher, handler
        // @ts-ignore
        if (handler.url) {
          $errUtils.throwErrByPath('net_stubbing.intercept.no_duplicate_url')
        }

        if (!arg2) {
          $errUtils.throwErrByPath('net_stubbing.intercept.handler_required')
        }

        checkExtraArguments(['url', 'mergeRouteMatcher', 'handler'])

        const opts = {
          url: matcher,
          ...handler as RouteMatcherOptions,
        }

        handler = arg2

        return opts
      }

      if (typeof matcher === 'string' && $utils.isValidHttpMethod(matcher) && isStringMatcher(handler)) {
        // method, url, handler?
        const url = handler as StringMatcher

        handler = arg2

        checkExtraArguments(['method', 'url', 'handler?'])

        return {
          method: matcher,
          url,
        }
      }

      if (isStringMatcher(matcher)) {
        // url, handler?
        checkExtraArguments(['url', 'handler?'])

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

  Commands.addAll({ intercept })
}
