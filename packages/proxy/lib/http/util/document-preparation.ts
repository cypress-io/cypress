import type { IncomingMessage } from 'http'
import type { RemoteState, DocumentDomainInjection } from '@packages/network-tools'
import type { CypressIncomingRequest } from '../../types'
import { acceptWillRenderHtml, contentTypeIsHtml, contentTypeIsJavaScript } from '@packages/network-interception'

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

  // only check the content-type value, if it exists, to contains some type of html mimetype
  const contentType = res?.headers['content-type'] || ''
  const contentTypeIsHtmlIfExists = contentType ? contentTypeIsHtml(contentType) : true

  // 'accept' and 'x-requested-with' are single-value headers; CypressIncomingRequest
  // types every header generically as string | string[], so narrow here to match
  // what the browser actually sends (and what acceptWillRenderHtml expects).
  return acceptWillRenderHtml(
    req.headers['accept'] as string | undefined,
    req.headers['x-requested-with'] as string | undefined,
  ) && contentTypeIsHtmlIfExists
}

export function resContentTypeIs (res: IncomingMessage, contentType: string) {
  return (res.headers['content-type'] || '').includes(contentType)
}

export function resContentTypeIsJavaScript (res: IncomingMessage) {
  return contentTypeIsJavaScript(res.headers['content-type'])
}
