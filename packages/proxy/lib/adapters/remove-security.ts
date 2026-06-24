import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import * as rewriter from '../http/util/rewriter'
import { resContentTypeIsJavaScript } from '../http/util/document-preparation'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/**
 * Strip framebusting / obstructive JS from proxied responses when configured.
 */
export async function removeSecurity (mw: ResponseInterceptionMiddlewareCtx): Promise<void> {
  const span = telemetry.startSpan({ name: 'maybe:remove:security', parentSpan: mw.resMiddlewareSpan, isVerbose })

  span?.setAttributes({
    wantsSecurityRemoved: mw.res.wantsSecurityRemoved || false,
  })

  if (!mw.res.wantsSecurityRemoved) {
    span?.end()

    return mw.next()
  }

  mw.debug('removing JS framebusting code')

  mw.makeResStreamPlainText()

  mw.incomingResStream.setEncoding('utf8')

  const streamSpan = telemetry.startSpan({ name: `maybe:remove:security-resp:stream`, parentSpan: span, isVerbose })

  mw.incomingResStream = mw.incomingResStream.pipe(rewriter.security({
    isNotJavascript: !resContentTypeIsJavaScript(mw.incomingRes),
    useAstSourceRewriting: mw.config.experimentalSourceRewriting,
    modifyObstructiveThirdPartyCode: mw.config.experimentalModifyObstructiveThirdPartyCode && !mw.remoteStates.isPrimarySuperDomainOrigin(mw.req.proxiedUrl),
    modifyObstructiveCode: mw.config.modifyObstructiveCode,
    removeSRIAttributes: mw.config.removeSRIAttributes && mw.remoteStates.isPrimarySuperDomainOrigin(mw.req.proxiedUrl),
    url: mw.req.proxiedUrl,
    deferSourceMapRewrite: mw.deferSourceMapRewrite,
  })).on('error', mw.onError).once('close', () => {
    streamSpan?.end()
  })

  span?.end()
  mw.next()
}
