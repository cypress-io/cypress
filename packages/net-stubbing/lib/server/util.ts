import _ from 'lodash'
import debugModule from 'debug'
import { ServerResponse } from 'http'
import { StaticResponse } from '../external-types'
import {
  RouteMatcherOptionsGeneric,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
} from '../types'
import { Readable } from 'stream'

const debug = debugModule('cypress:net-stubbing:server:util')

export function emit (socket: any, eventName: string, data: any) {
  debug('sending event to driver %o', { eventName, data })
  socket.toDriver('net:event', eventName, data)
}

export function getAllStringMatcherFields (options: RouteMatcherOptionsGeneric<any>) {
  return _.concat(
    _.filter(STRING_MATCHER_FIELDS, _.partial(_.has, options)),
    // add the nested DictStringMatcher values to the list of fields
    _.flatten(
      _.filter(
        DICT_STRING_MATCHER_FIELDS.map((field) => {
          const value = options[field]

          if (value) {
            return _.keys(value).map((key) => {
              return `${field}.${key}`
            })
          }

          return ''
        })
      )
    )
  )
}

export function sendStaticResponse (res: ServerResponse, staticResponse: StaticResponse, resStream?: Readable) {
  if (staticResponse.destroySocket) {
    res.connection.destroy()
    res.destroy()

    return
  }

  const statusCode = staticResponse.statusCode || 200
  const headers = staticResponse.headers

  res.writeHead(statusCode, headers || {})

  res.flushHeaders()

  if (resStream) {
    // ignore staticResponse.body
    return resStream.pipe(res)
  }

  if (staticResponse.body) {
    res.write(staticResponse.body)
  }

  res.end()

  return
}
