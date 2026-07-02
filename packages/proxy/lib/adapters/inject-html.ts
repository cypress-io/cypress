import iconv from 'iconv-lite'
import { PassThrough } from 'stream'
import { concatStream } from '@packages/network'
import { getDomainNameFromUrl, DocumentDomainInjection } from '@packages/network-tools'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import * as rewriter from '../http/util/rewriter'
import { getNodeCharsetFromResponse } from '../http/util/response-stream'
import { resContentTypeIsJavaScript } from '../http/util/document-preparation'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/**
 * Inject Cypress bridge HTML/JS into proxied document responses.
 */
export async function injectHtml (mw: ResponseInterceptionMiddlewareCtx): Promise<void> {
  const span = telemetry.startSpan({ name: 'maybe:inject:html', parentSpan: mw.resMiddlewareSpan, isVerbose })

  span?.setAttributes({
    wantsInjection: mw.res.wantsInjection,
  })

  if (!mw.res.wantsInjection) {
    span?.end()

    return mw.next()
  }

  mw.skipMiddleware('MaybeRemoveSecurity')

  mw.debug('injecting into HTML')

  mw.makeResStreamPlainText()

  const streamSpan = telemetry.startSpan({ name: `maybe:inject:html-resp:stream`, parentSpan: span, isVerbose })

  mw.incomingResStream.pipe(concatStream(async (body) => {
    const nodeCharset = getNodeCharsetFromResponse(mw.incomingRes.headers, body, mw.debug)

    const decodedBody = iconv.decode(body, nodeCharset)
    const injectedBody = await rewriter.html(decodedBody, {
      cspNonce: mw.res.injectionNonce,
      domainName: getDomainNameFromUrl(mw.req.proxiedUrl),
      wantsInjection: mw.res.wantsInjection,
      wantsSecurityRemoved: mw.res.wantsSecurityRemoved,
      isNotJavascript: !resContentTypeIsJavaScript(mw.incomingRes),
      useAstSourceRewriting: mw.config.experimentalSourceRewriting,
      modifyObstructiveThirdPartyCode: mw.config.experimentalModifyObstructiveThirdPartyCode && !mw.remoteStates.isPrimarySuperDomainOrigin(mw.req.proxiedUrl),
      shouldInjectDocumentDomain: DocumentDomainInjection.InjectionBehavior(mw.config).shouldInjectDocumentDomain(mw.req.proxiedUrl),
      modifyObstructiveCode: mw.config.modifyObstructiveCode,
      removeSRIAttributes: mw.config.removeSRIAttributes && mw.remoteStates.isPrimarySuperDomainOrigin(mw.req.proxiedUrl),
      url: mw.req.proxiedUrl,
      deferSourceMapRewrite: mw.deferSourceMapRewrite,
      simulatedCookies: mw.simulatedCookies,
    })
    const encodedBody = iconv.encode(injectedBody, nodeCharset)

    const pt = new PassThrough

    pt.write(encodedBody)
    pt.end()

    mw.incomingResStream = pt

    streamSpan?.end()
    mw.next()
  })).on('error', mw.onError).once('close', () => {
    span?.end()
  })
}
