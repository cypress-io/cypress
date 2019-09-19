// missing type definitions for libraries
// https://glebbahmutov.com/blog/trying-typescript/#manual-types-for-3rd-party-libraries

/// <reference path="../../cli/types/sinon/index.d.ts" />

declare module '@cypress/get-windows-proxy' {
  type ProxyConfig = {
    httpProxy: string
    noProxy: string
  }
  function getWindowsProxy(): Optional<ProxyConfig>
  export = getWindowsProxy
}

/**
 * For properties on `Cypress` and `cy` that are not intended for public use.
 */
declare namespace Cypress {
  interface CypressUtils {
    warnByPath: (path: string, obj: any) => void
  }

  interface Actions {
    (action: 'net:event', frame: any)
  }

  interface cy {
    /**
     * If `as` is chained to the current command, return the alias name used.
     */
    getNextAlias: () => Optional<string>
    retry: (fn: () => any, opts: any) => any
  }

  interface Cypress {
    backend: (eventName: string, ...args: any[]) => Promise<any>
    routes: {
      [routeHandlerId: string]: any
    }
    sinon: sinon.SinonStatic
    utils: CypressUtils
  }

  interface LogConfig {
    message?: string
    instrument?: 'route'
    isStubbed?: boolean
    alias?: string
    aliasType?: 'route'
    type?: 'parent'
    event?: boolean
    method?: string
    url?: string
    status?: number
    numResponses?: number
    response?: string
    renderProps?: () => {
      indicator?: 'aborted' | 'pending' | 'successful' | 'bad'
      message?: string
    }
  }
}

declare module 'http' {
  import { Socket } from 'net'
  import { Url } from 'url'

  type SocketCallback = (err: Optional<Error>, sock: Optional<Socket>) => void

  interface Agent {
    addRequest(req: ClientRequest, options: RequestOptions): void
    createSocket(req: ClientRequest, options: RequestOptions, cb: SocketCallback): void
    createConnection(options: RequestOptions, cb: Optional<SocketCallback>): void
    protocol: 'http:' | 'https:' | string
    freeSockets: {
      [key: string]: Socket[]
    }
  }

  interface ClientRequest {
    _header: { [key: string]:string }
    _implicitHeader: () => void
    output: string[]
    agent: Agent
  }

  interface RequestOptions extends ClientRequestArgs {
    _agentKey: Optional<symbol>
    host: string
    href: string
    port: number
    proxy: Optional<string>
    servername: Optional<string>
    socket: Optional<Socket>
    uri: Url
  }

  interface OutgoingMessage {
    destroy(error?: Error): void
  }

  export const CRLF: string
}

declare module 'https' {
  interface Agent {
    _sessionCache: { [_agentKey: string]: Buffer }
  }
}

declare interface InternalStream {
  queue(str: string | null): void
}

declare module 'net' {
  type family = 4 | 6
  type TCPSocket = {}

  interface Address {
    address: string
    family: family
  }

  interface Socket {
    _handle: TCPSocket | null
  }

}

declare interface Object {
  assign(...obj: any[]): any
}

declare type Optional<T> = T | void

declare module 'plist' {
  interface Plist {
    parse: (s:string) => any
  }
  const plist: Plist
  export = plist
}

declare module 'proxy-from-env' {
  const getProxyForUrl: (url: string) => string
}

declare interface SymbolConstructor {
  for(str: string): SymbolConstructor
}
