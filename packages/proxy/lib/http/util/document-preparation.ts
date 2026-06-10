import _ from 'lodash'
import type { IncomingMessage } from 'http'
import type { RemoteState, DocumentDomainInjection } from '@packages/network-tools'
import type { CypressIncomingRequest } from '../../types'

export function reqMatchesPolicyBasedOnDomain (
  req: CypressIncomingRequest,
  remoteState: RemoteState,
  documentDomainInjection: DocumentDomainInjection,
) {
  if (remoteState.strategy === 'http') {
    return documentDomainInjection.urlsMatch(
      req.proxiedUrl,
      remoteState.props || '',
    )
  }

  if (remoteState.strategy === 'file') {
    return req.proxiedUrl.startsWith(remoteState.origin)
  }

  return false
}

export function reqWillRenderHtml (req: CypressIncomingRequest, res: IncomingMessage) {
  // will this request be rendered in the browser, necessitating injection?
  // https://github.com/cypress-io/cypress/issues/288

  // don't inject if this is an XHR from jquery
  if (req.headers['x-requested-with']) {
    return
  }

  // don't inject if we didn't find both text/html and application/xhtml+xml,
  const accept = req.headers['accept']

  // only check the content-type value, if it exists, to contains some type of html mimetype
  const contentType = res?.headers['content-type'] || ''
  const contentTypeIsHtmlIfExists = contentType ? contentType.includes('html') : true

  return accept && accept.includes('text/html') && accept.includes('application/xhtml+xml') && contentTypeIsHtmlIfExists
}

export function resContentTypeIs (res: IncomingMessage, contentType: string) {
  return (res.headers['content-type'] || '').includes(contentType)
}

export function resContentTypeIsJavaScript (res: IncomingMessage) {
  return _.some(
    ['application/javascript', 'application/x-javascript', 'text/javascript']
    .map(_.partial(resContentTypeIs, res)),
  )
}
