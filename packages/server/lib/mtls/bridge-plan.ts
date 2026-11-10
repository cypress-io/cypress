import * as errors from '../errors'

const DEFAULT_HTTPS_PORT = 443

/**
 * TLS material for one origin, shaped to match Node's `tls.createSecureContext` options so
 * a composition root can hand it straight to a connection.
 */
export interface ClientCertificateMaterial {
  ca?: Buffer[]
  cert?: Buffer[]
  key?: { pem: Buffer, passphrase?: string }[]
  pfx?: { buf: Buffer, passphrase?: string }[]
}

/**
 * A `clientCertificates` entry with its URL already parsed. The caller parses, so this
 * package never re-derives the wildcard and path semantics that `UrlMatcher` owns.
 */
export interface ClientCertificateEntry {
  /** The configured URL verbatim, used in error messages. */
  url: string
  /** Hostname or wildcard pattern, e.g. `example.com` or `*.example.com`. */
  hostname: string
  /** Port from the configured URL, or undefined when it omitted one. */
  port?: number
  /** Whether a servername is one `hostname` stands for, by `UrlMatcher`'s rules for a pattern. */
  hostMatcher: HostMatcher
  /** Whether the URL limits the certificate to part of the origin. */
  pathScoped: boolean
  material: ClientCertificateMaterial
}

interface HostMatcher {
  match (hostname: string): boolean
}

/** One listener the bridge must open, and the origin it stands in for. */
export interface BridgeListener {
  hostname: string
  port: number
  hostMatcher: HostMatcher
  material: ClientCertificateMaterial
  /** Every configured URL that collapsed into this listener. */
  sourceUrls: string[]
}

/** A planned listener once it has been bound to a local port. */
export interface BoundBridgeListener {
  hostname: string
  port: number
  listenPort: number
}

/**
 * Collapses `clientCertificates` entries into one listener per origin.
 *
 * An entry whose URL omits a port matches any port, but a resolver rule can only redirect a
 * port it knows, so those collapse onto 443.
 *
 * Certificate selection is per-connection, not per-request: under HTTP/2 the browser
 * multiplexes every request to an origin onto a single connection, so the certificate is
 * chosen during one handshake, before any path exists. Entries that differ only by path
 * therefore cannot both be honored, and two entries for the same origin carrying different
 * material is a configuration that no transport can satisfy — it fails here, at startup,
 * rather than silently presenting whichever one happened to win.
 *
 * For the same reason a path-scoped entry cannot be kept to its path: the resolver rule
 * steers the whole origin, so any page could reach any path on it with the certificate
 * attached. An origin is only bridged when some entry configures it whole, or when the
 * wildcard that would otherwise steer it already presents the same certificate on every path.
 */
export function planBridgeListeners (entries: ClientCertificateEntry[]): BridgeListener[] {
  const listeners = new Map<string, BridgeListener>()
  const originWide = new Set<string>()

  entries.forEach((entry) => {
    const port = entry.port ?? DEFAULT_HTTPS_PORT
    const key = `${entry.hostname}:${port}`
    const existing = listeners.get(key)

    if (!entry.pathScoped) {
      originWide.add(key)
    }

    if (!existing) {
      listeners.set(key, {
        hostname: entry.hostname,
        port,
        hostMatcher: entry.hostMatcher,
        material: entry.material,
        sourceUrls: [entry.url],
      })

      return
    }

    if (materialKey(existing.material) !== materialKey(entry.material)) {
      return errors.throwErr('CLIENT_CERTIFICATES_CONFLICT', key, [...existing.sourceUrls, entry.url])
    }

    existing.sourceUrls.push(entry.url)
  })

  const wildcards = [...listeners]
  .filter(([key, listener]) => originWide.has(key) && listener.hostname.includes('*'))
  .map(([, listener]) => listener)

  listeners.forEach((listener, key) => {
    if (originWide.has(key)) {
      return
    }

    const covering = coveringWildcard(listener, wildcards)

    if (!covering || materialKey(covering.material) !== materialKey(listener.material)) {
      return errors.throwErr('CLIENT_CERTIFICATES_PATH_SCOPED', key, listener.sourceUrls)
    }

    // Without its own resolver rule the origin falls through to the wildcard's, which
    // presents the same certificate it would have
    listeners.delete(key)
  })

  return [...listeners.values()]
}

/** The listener Chromium would steer this origin to if it had no rule of its own. */
function coveringWildcard (listener: BridgeListener, wildcards: BridgeListener[]): BridgeListener | undefined {
  return wildcards
  .filter((wildcard) => wildcard.port === listener.port && wildcard.hostMatcher.match(listener.hostname))
  .sort((a, b) => wildcardBreadth(a.hostname) - wildcardBreadth(b.hostname))[0]
}

/**
 * How many hosts a pattern can match: fewer is more specific. A pattern with no wildcard
 * matches exactly one host, and `*` matches everything.
 */
function wildcardBreadth (hostname: string): number {
  if (!hostname.includes('*')) {
    return 0
  }

  // `*` is broader than `*.example.com`, which is broader than `*.a.example.com`
  return hostname === '*' ? Number.MAX_SAFE_INTEGER : 1 / hostname.length
}

/**
 * Renders listeners as a Chromium `--host-resolver-rules` value, steering only the
 * configured origins at the bridge. The pattern carries the origin port so a plain HTTP
 * port on the same host is left alone.
 *
 * Chromium applies the first matching rule, and a wildcard also matches a host an exact
 * entry names, so the most specific pattern has to come first. Otherwise a catch-all listed
 * ahead of an override would steer that origin to the wrong listener and present the wrong
 * certificate — and nothing else would catch it, because the two are different origins and
 * so never collide in `planBridgeListeners`.
 */
export function formatHostResolverRules (listeners: BoundBridgeListener[]): string {
  return [...listeners]
  .sort((a, b) => wildcardBreadth(a.hostname) - wildcardBreadth(b.hostname))
  .map(({ hostname, port, listenPort }) => `MAP ${hostname}:${port} 127.0.0.1:${listenPort}`)
  .join(',')
}

/** Positional so a field left undefined compares equal to the same field left empty. */
function materialKey (material: ClientCertificateMaterial): string {
  return JSON.stringify([material.ca ?? [], material.cert ?? [], material.key ?? [], material.pfx ?? []])
}
