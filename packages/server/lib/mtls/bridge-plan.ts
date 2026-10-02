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
  material: ClientCertificateMaterial
}

/** One listener the bridge must open, and the origin it stands in for. */
export interface BridgeListener {
  hostname: string
  port: number
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
 */
export function planBridgeListeners (entries: ClientCertificateEntry[]): BridgeListener[] {
  const listeners = new Map<string, BridgeListener>()

  entries.forEach((entry) => {
    const port = entry.port ?? DEFAULT_HTTPS_PORT
    const key = `${entry.hostname}:${port}`
    const existing = listeners.get(key)

    if (!existing) {
      listeners.set(key, {
        hostname: entry.hostname,
        port,
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

  return [...listeners.values()]
}

/**
 * Renders listeners as a Chromium `--host-resolver-rules` value, steering only the
 * configured origins at the bridge. The pattern carries the origin port so a plain HTTP
 * port on the same host is left alone.
 */
export function formatHostResolverRules (listeners: BoundBridgeListener[]): string {
  return listeners
  .map(({ hostname, port, listenPort }) => `MAP ${hostname}:${port} 127.0.0.1:${listenPort}`)
  .join(',')
}

/** Positional so a field left undefined compares equal to the same field left empty. */
function materialKey (material: ClientCertificateMaterial): string {
  return JSON.stringify([material.ca ?? [], material.cert ?? [], material.key ?? [], material.pfx ?? []])
}
