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
  if (req.headers['x-requested-with']) {
    return
  }

  const accept = req.headers['accept']
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
