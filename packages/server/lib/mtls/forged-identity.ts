import tls from 'tls'
import type { SecureContext } from 'tls'
import { CA } from '@packages/https-proxy'

/**
 * Mints server certificates impersonating an origin, from the same CA the HTTPS proxy uses.
 *
 * The browser accepts these because the browser (CDP) path already launches with a blanket
 * `--ignore-certificate-errors`. Chrome therefore treats the connection as a clicked-through
 * warning and will not disk-cache from it, the same as the HTTP/1 proxy path.
 */
export async function createForgedIdentity (caFolder: string) {
  const ca = await CA.create(caFolder)
  const contexts = new Map<string, Promise<SecureContext>>()

  const mint = async (servername: string): Promise<SecureContext> => {
    const [cert, key] = await ca.generateServerCertificateKeys(servername)

    return tls.createSecureContext({ cert, key })
  }

  return {
    secureContextFor (servername: string): Promise<SecureContext> {
      let context = contexts.get(servername)

      if (!context) {
        context = mint(servername)
        contexts.set(servername, context)
      }

      return context
    },
  }
}
