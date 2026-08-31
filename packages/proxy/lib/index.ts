export { NetworkProxy } from './network-proxy'

export * from './types'

export { ResourceType, RequestCredentialLevel } from './resourceTypeAndCredentialManager'

export { createSyntheticProxyCodec, toIdentityResponse } from './adapters/synthetic-proxy-codec'

export { createProxyNetworkInterception } from './adapters/create-proxy-network-interception'

export type { CreateProxyNetworkInterceptionOptions } from './adapters/create-proxy-network-interception'

export { defaultMiddleware } from './http'
