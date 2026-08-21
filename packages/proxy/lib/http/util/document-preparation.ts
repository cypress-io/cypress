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

// Pure, header-value-shaped predicates shared with should-stream-response-body.ts
// (packages/server/lib/browsers/cdp-protocol) so both classifiers agree on
// what counts as HTML/JS content-type and an HTML-rendering Accept header,
// without either one re-deriving the type lists or matching semantics.

export function contentTypeIsHtml (contentType: string | undefined): boolean {
  return !!contentType && contentType.includes('html')
}

export function acceptWillRenderHtml (accept: string | undefined, xRequestedWith: string | undefined): boolean {
  // don't inject if this is an XHR from jquery
  if (xRequestedWith) {
    return false
  }

  // don't inject if we didn't find both text/html and application/xhtml+xml
  return !!accept && accept.includes('text/html') && accept.includes('application/xhtml+xml')
}

const JAVASCRIPT_CONTENT_TYPES = ['application/javascript', 'application/x-javascript', 'text/javascript']

export function contentTypeIsJavaScript (contentType: string | undefined): boolean {
  return !!contentType && JAVASCRIPT_CONTENT_TYPES.some((type) => contentType.includes(type))
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
