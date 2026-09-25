const TLS_HANDSHAKE_RECORD = 0x16
const CLIENT_HELLO = 0x01
const EXT_SERVER_NAME = 0x0000
const EXT_ALPN = 0x0010

/**
 * The outcome of inspecting the first bytes a client sends.
 *
 * Each case needs different handling, so they stay distinct rather than collapsing into a
 * nullable result: `incomplete` must buffer more, `not-tls` has no certificate to present
 * and is refused, and only `client-hello` can drive upstream negotiation.
 */
export type ClientHelloScan =
  | { kind: 'incomplete' }
  | { kind: 'not-tls' }
  | {
    kind: 'client-hello'
    servername: string | null
    /**
       * Protocols the client offered, in its order of preference. Empty means the client
       * sent no ALPN extension, which is not the same as offering nothing — the upstream
       * connection must then omit ALPN entirely rather than offer an empty list.
       */
    alpnProtocols: string[]
  }

/**
 * Reads the SNI servername and ALPN list out of a TLS ClientHello without terminating the
 * connection, so the bridge can negotiate upstream first and then offer the browser
 * exactly the protocol the origin chose.
 */
export function scanClientHello (buf: Buffer): ClientHelloScan {
  if (buf.length < 1) {
    return { kind: 'incomplete' }
  }

  if (buf[0] !== TLS_HANDSHAKE_RECORD) {
    return { kind: 'not-tls' }
  }

  if (buf.length < 5) {
    return { kind: 'incomplete' }
  }

  const recordEnd = 5 + buf.readUInt16BE(3)

  // A ClientHello can straddle TCP segments; wait for the whole record rather than
  // parsing a truncated one.
  if (buf.length < recordEnd) {
    return { kind: 'incomplete' }
  }

  let p = 5

  if (buf[p] !== CLIENT_HELLO) {
    return { kind: 'not-tls' }
  }

  p += 4 // handshake header
  p += 2 + 32 // legacy_version + random

  const skipVector = (lengthBytes: 1 | 2): void => {
    p += lengthBytes + (lengthBytes === 1 ? buf[p] : buf.readUInt16BE(p))
  }

  skipVector(1) // session_id
  skipVector(2) // cipher_suites
  skipVector(1) // compression_methods

  // TLS 1.2 permits a ClientHello with no extensions at all.
  if (p + 2 > recordEnd) {
    return { kind: 'client-hello', servername: null, alpnProtocols: [] }
  }

  const extensionsEnd = Math.min(p + 2 + buf.readUInt16BE(p), recordEnd)

  p += 2

  let servername: string | null = null
  let alpnProtocols: string[] = []

  while (p + 4 <= extensionsEnd) {
    const type = buf.readUInt16BE(p)
    const length = buf.readUInt16BE(p + 2)
    const body = buf.subarray(p + 4, p + 4 + length)

    if (type === EXT_SERVER_NAME) {
      servername = readFirstServerName(body)
    } else if (type === EXT_ALPN) {
      alpnProtocols = readAlpnList(body)
    }

    p += 4 + length
  }

  return { kind: 'client-hello', servername, alpnProtocols }
}

function readFirstServerName (body: Buffer): string | null {
  // server_name_list length (2) + name_type (1) + name length (2)
  if (body.length < 5) {
    return null
  }

  const nameLength = body.readUInt16BE(3)

  if (body.length < 5 + nameLength) {
    return null
  }

  return body.subarray(5, 5 + nameLength).toString('utf8')
}

function readAlpnList (body: Buffer): string[] {
  const protocols: string[] = []
  let p = 2 // ALPN protocol list length

  while (p < body.length) {
    const length = body[p]

    if (p + 1 + length > body.length) {
      break
    }

    protocols.push(body.subarray(p + 1, p + 1 + length).toString('utf8'))
    p += 1 + length
  }

  return protocols
}
