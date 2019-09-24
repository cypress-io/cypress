import _ from 'lodash'
import debugModule from 'debug'
import isHtml from 'is-html'
import { ServerResponse, IncomingMessage } from 'http'
import { StaticResponse } from '../external-types'
import {
  RouteMatcherOptionsGeneric,
  STRING_MATCHER_FIELDS,
  DICT_STRING_MATCHER_FIELDS,
} from '../types'
import { Readable, PassThrough } from 'stream'
import CyServer from '@packages/server'
import { Socket } from 'net'

const debug = debugModule('cypress:net-stubbing:server:util')

export function emit (socket: CyServer.Socket, eventName: string, data: object) {
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

function _getFakeClientResponse (opts: {
  statusCode: number
  headers: {
    [k: string]: string
  }
  body: string
}) {
  const clientResponse = new IncomingMessage(new Socket)

  // be nice and infer this content-type for the user
  if (!_.keys(opts.headers).map(_.toLower).includes('content-type') && isHtml(opts.body)) {
    opts.headers['content-type'] = 'text/html'
  }

  _.merge(clientResponse, opts)

  return clientResponse
}

export function sendStaticResponse (res: ServerResponse, staticResponse: StaticResponse, onResponse: (incomingRes: IncomingMessage, stream: Readable) => void, resStream?: Readable) {
  if (staticResponse.destroySocket) {
    res.connection.destroy()
    res.destroy()

    return
  }

  const statusCode = staticResponse.statusCode || 200
  const headers = staticResponse.headers || {}
  const body = resStream ? '' : staticResponse.body || ''

  const incomingRes = _getFakeClientResponse({
    statusCode,
    headers,
    body,
  })

  if (!resStream) {
    const pt = new PassThrough()

    if (staticResponse.body) {
      pt.write(staticResponse.body)
    }

    pt.end()

    resStream = pt
  }

  onResponse(incomingRes, resStream)
}
