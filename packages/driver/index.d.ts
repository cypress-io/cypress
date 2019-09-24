/// <reference path="../../cli/types/index.d.ts" />

/**
 * For properties on `Cypress` and `cy` that are not intended for public use.
 */
declare global {
  namespace Cypress {
    interface CypressUtils {
      throwErrByPath: (path: string, obj: { args: object }) => void
      warnByPath: (path: string, obj: { args: object }) => void
    }

    interface Actions {
      (action: 'net:event', frame: any)
    }

    interface cy {
      /**
       * If `as` is chained to the current command, return the alias name used.
       */
      getNextAlias: () => string | undefined
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

    type Log = ReturnType<Cypress.log>

    interface LogConfig {
      message: any[]
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
}

export as namespace Cypress

export const $Cypress: Cypress.Cypress

export default $Cypress
