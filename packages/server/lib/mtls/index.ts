import Debug from 'debug'
import { MtlsBridge } from './mtls-bridge'
import { formatHostResolverRules, planBridgeListeners } from './bridge-plan'
import type { ClientCertificateEntry } from './bridge-plan'
// via the package entry, not a deep path: a deep import resolves to a second copy of the
// module with its own empty store, and the entries loaded at server open would be invisible
import { clientCertificates as certStore } from '@packages/network'
import { createForgedIdentity } from './forged-identity'
import { connectUpstream } from './upstream-connection'

const debug = Debug('cypress:server:mtls')

export interface MtlsBridgeLaunchOpts {
  /** Appended to the browser's `--host-resolver-rules`. */
  hostResolverRules: string
  close: () => Promise<void>
}

/**
 * Presents configured `clientCertificates` for requests the browser itself issues.
 *
 * On the browser (CDP) network path Chromium performs its own DNS, TCP and TLS, and CDP
 * exposes no way to hand it a private key, so mutual TLS cannot be negotiated browser-side
 * at all. Chromium is instead launched with a `--host-resolver-rules` entry per configured
 * origin, steering just those origins at a local listener, which then:
 *
 * 1. reads the ClientHello off the socket without answering it, recovering SNI and ALPN;
 * 2. opens the real connection to the origin from Node, presenting the client certificate;
 * 3. answers the browser with a forged certificate, offering only the protocol the origin
 *    selected;
 * 4. pipes the two sessions together.
 *
 * Nothing above TLS is parsed, so HTTP/2 survives end to end and the browser still issues,
 * labels and reports these requests itself — CDP interception and Test Replay are untouched.
 *
 * Known limitation: resolver rules are launch-time arguments, so a session that attaches to
 * a browser someone else launched (`connectToExisting`) inherits that browser's arguments.
 * No rule steers its traffic here and the certificate is never presented.
 *
 * Returns undefined when there is nothing to bridge. Only this path needs it: on the MITM
 * path the Node agent already presents client certificates, because it makes every request.
 *
 * https://github.com/cypress-io/cypress/issues/34807
 */
export async function createMtlsBridge (options: {
  clientCertificates: { url: string }[]
  caFolder: string
}): Promise<MtlsBridgeLaunchOpts | undefined> {
  const entries = toBridgeEntries(options.clientCertificates)

  if (!entries.length) {
    return undefined
  }

  const listeners = planBridgeListeners(entries)
  const identity = await createForgedIdentity(options.caFolder)

  const bridge = new MtlsBridge({
    listeners,
    connectUpstream,
    secureContextFor: identity.secureContextFor,
  })

  const bound = await bridge.listen()

  debug('bridging %d origin(s): %o', bound.length, bound)

  return {
    hostResolverRules: formatHostResolverRules(bound),
    close: () => bridge.close(),
  }
}

/**
 * Pairs each configured URL with the material the store already loaded for it, using the
 * store's own parsing so the bridge never re-derives `UrlMatcher`'s semantics.
 */
export function toBridgeEntries (clientCertificates: { url: string }[]): ClientCertificateEntry[] {
  return clientCertificates.flatMap((item) => {
    const parsed = new certStore.ParsedUrl(item.url)
    const material = certStore.clientCertificateStoreSingleton.getClientCertificatesForConfiguredUrl(item.url)

    if (!material) {
      return []
    }

    return [{
      url: item.url,
      hostname: parsed.host,
      port: parsed.port,
      material,
    }]
  })
}
