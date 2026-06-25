import { blocked } from '@packages/network'
import { CyIntercept } from '@packages/net-stubbing'
import {
  createBlockConfiguredHosts,
  createCspConfiguredAllowList,
  HttpIntercept,
} from '@packages/network-interception'
import type { SocketBroadcaster } from '@packages/socket'

type InterceptConfig = {
  blockHosts?: string | string[] | null
  experimentalCspAllowList?: boolean | string[] | null
  devServerPublicPathRoute?: string
}

type HandleSkippedSyncIntercept = (url: string) => void

/**
 * Composition root for the proxy HttpIntercept onion:
 * blockHosts (outer) → CSP allow-list → CyIntercept (inner).
 */
export function createHttpInterceptStack (
  config: InterceptConfig,
  socket: SocketBroadcaster,
  onSyncInterceptSkipped?: HandleSkippedSyncIntercept,
): {
  httpIntercept: HttpIntercept
  cyIntercept: CyIntercept
} {
  const httpIntercept = new HttpIntercept()

  httpIntercept.use(createBlockConfiguredHosts({
    config,
    matchesBlockedHost: blocked.matches,
  }))

  httpIntercept.use(createCspConfiguredAllowList(config))

  const cyIntercept = new CyIntercept({
    socket,
    onSyncInterceptSkipped,
    config: {
      devServerPublicPathRoute: config.devServerPublicPathRoute,
    },
  })

  httpIntercept.use(cyIntercept.middleware)

  return { httpIntercept, cyIntercept }
}
