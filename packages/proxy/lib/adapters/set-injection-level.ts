import crypto from 'crypto'
import _ from 'lodash'
import { URL } from 'url'
import { DocumentDomainInjection } from '@packages/network-tools'
import { resolveInjectionLevel, resolveWantsSecurityRemoved } from '@packages/network-interception'
import { telemetry } from '@packages/telemetry'
import { isVerboseTelemetry as isVerbose } from '../http'
import { cspHeaderNames, generateCspDirectives, nonceDirectives, parseCspHeaders } from '../http/util/csp-header'
import {
  reqMatchesPolicyBasedOnDomain,
  reqWillRenderHtml,
  resContentTypeIs,
  resContentTypeIsJavaScript,
} from '../http/util/document-preparation'
import type { ResponseInterceptionMiddlewareCtx } from './types'

/**
 * Determine injection level and CSP nonce headers for proxied HTML responses.
 */
export async function setInjectionLevel (mw: ResponseInterceptionMiddlewareCtx): Promise<void> {
  const span = telemetry.startSpan({ name: 'set:injection:level', parentSpan: mw.resMiddlewareSpan, isVerbose })

  mw.res.isInitial = mw.req.cookies['__cypress.initial'] === 'true'

  const isHTML = resContentTypeIs(mw.incomingRes, 'text/html')
  const isRenderedHTML = reqWillRenderHtml(mw.req, mw.incomingRes)

  if (isRenderedHTML) {
    const origin = new URL(mw.req.proxiedUrl).origin

    mw.getRenderedHTMLOrigins()[origin] = true
  }

  mw.debug('determine injection')

  const documentDomainInjection = DocumentDomainInjection.InjectionBehavior(mw.config)
  const isReqMatchSuperDomainOrigin = reqMatchesPolicyBasedOnDomain(
    mw.req,
    mw.remoteStates.current(),
    documentDomainInjection,
  )

  span?.setAttributes({
    isInitialInjection: mw.res.isInitial,
    isHTML,
    isRenderedHTML,
    isReqMatchSuperDomainOrigin,
  })

  // NOTE: Only inject fullCrossOrigin if the super domain origins do not match in order to keep parity with cypress application reloads
  const urlDoesNotMatchPolicyBasedOnDomain = !reqMatchesPolicyBasedOnDomain(
    mw.req,
    mw.remoteStates.getPrimary(),
    documentDomainInjection,
  )
  const isAUTFrame = mw.req.isAUTFrame

  span?.setAttributes({
    isAUTFrame,
    urlDoesNotMatchPolicyBasedOnDomain,
  })

  if (mw.res.wantsInjection != null) {
    span?.setAttributes({
      isInjectionAlreadySet: true,
    })

    mw.debug('- already has injection: %s', mw.res.wantsInjection)
  }

  if (mw.res.wantsInjection == null) {
    const level = resolveInjectionLevel({
      hasFileServerError: !!mw.incomingRes.headers['x-cypress-file-server-error'],
      isInitial: mw.res.isInitial,
      isHTML,
      isRenderedHTML: !!isRenderedHTML,
      isReqMatchSuperDomainOrigin,
      isAUTFrame,
      urlDoesNotMatchPolicyBasedOnDomain,
    })

    if (level === 'partial' && mw.incomingRes.headers['x-cypress-file-server-error'] && !mw.res.isInitial) {
      mw.debug('- partial injection (x-cypress-file-server-error)')
    } else if (level === 'fullCrossOrigin') {
      mw.debug('- cross origin injection')
    } else if (level === false && (!isHTML || (!isReqMatchSuperDomainOrigin && !isAUTFrame))) {
      mw.debug('- no injection (not html)')
    } else if (level === 'full') {
      mw.debug('- full injection')
    } else if (level === false && !isRenderedHTML) {
      mw.debug('- no injection (not rendered html)')
    } else if (level === 'partial') {
      mw.debug('- partial injection (default)')
    }

    mw.res.wantsInjection = level
  }

  if (mw.res.wantsInjection) {
    // Chrome plans to make document.domain immutable in Chrome 109, with the default value
    // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
    // so that we can continue to support tests that visit multiple subdomains in a single spec.
    // https://github.com/cypress-io/cypress/issues/20147
    //
    // We set the header here only for proxied requests that have scripts injected that set the domain.
    // Other proxied requests are ignored.
    mw.res.setHeader('Origin-Agent-Cluster', '?0')

    // In order to allow the injected script to run on sites with a CSP header
    // we must add a generated `nonce` into the response headers
    const nonce = crypto.randomBytes(16).toString('base64')

    // Iterate through each CSP header
    cspHeaderNames.forEach((headerName) => {
      const policyArray = parseCspHeaders(mw.res.getHeaders(), headerName)
      const usedNonceDirectives = nonceDirectives
      // If there are no used CSP directives that restrict script src execution, our script will run
      // without the nonce, so we will not add it to the response
      .filter((directive) => policyArray.some((policyMap) => policyMap.has(directive)))

      if (usedNonceDirectives.length) {
        // If there is a CSP directive that that restrict script src execution, we must add the
        // nonce policy to each supported directive of each CSP header. This is due to the effect
        // of [multiple policies](https://w3c.github.io/webappsec-csp/#multiple-policies) in CSP.
        mw.res.injectionNonce = nonce
        const modifiedCspHeader = policyArray.map((policies) => {
          usedNonceDirectives.forEach((availableNonceDirective) => {
            if (policies.has(availableNonceDirective)) {
              const cspScriptSrc = policies.get(availableNonceDirective) || []

              // We are mutating the policy map, and we will set it back to the response headers later
              policies.set(availableNonceDirective, [...cspScriptSrc, `'nonce-${nonce}'`])
            }
          })

          return policies
        }).map(generateCspDirectives)

        // To replicate original response CSP headers, we must apply all header values as an array
        mw.res.setHeader(headerName, modifiedCspHeader)
      }
    })
  }

  mw.res.wantsSecurityRemoved = resolveWantsSecurityRemoved({
    modifyObstructiveCode: !!mw.config.modifyObstructiveCode,
    experimentalModifyObstructiveThirdPartyCode: !!mw.config.experimentalModifyObstructiveThirdPartyCode,
    wantsInjection: mw.res.wantsInjection,
    isHTML,
    isRenderedHTML: !!isRenderedHTML,
    isReqMatchSuperDomainOrigin,
    isJavaScript: resContentTypeIsJavaScript(mw.incomingRes),
  })

  span?.setAttributes({
    wantsInjection: mw.res.wantsInjection,
    wantsSecurityRemoved: mw.res.wantsSecurityRemoved,
  })

  mw.debug('injection levels: %o', _.pick(mw.res, 'isInitial', 'wantsInjection', 'wantsSecurityRemoved'))

  span?.end()
  mw.next()
}
