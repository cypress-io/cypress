import type {
  CommandLogInterceptionResult,
  ForBrowserNetworkAutomation,
  ForCommandLog,
  ForCookieState,
  ForDocumentPreparation,
  ForNetworkCapture,
  ForRequestInterception,
  ForResponseInterception,
} from '../ports/driven-ports'
import type { RunPoliciesResult } from '../registry/network-policy-registry'

/** No-op driven ports for HTTP/2 browser-adapter unit tests and future composition roots. */
export function createStubDrivenPorts () {
  const noopAsync = async () => {}
  const noop = () => {}

  const requestInterception: ForRequestInterception = {
    correlateBrowserPreRequest: noopAsync,
    forwardToOrigin: noop,
    endRequestIfBlocked: async (_ctx, runPolicies) => {
      await runPolicies()
    },
  }

  const responseInterception: ForResponseInterception = {
    interceptResponse: noopAsync,
  }

  const documentPreparation: ForDocumentPreparation = {
    setInjectionLevel: noopAsync,
    injectHtml: noopAsync,
    removeSecurity: noopAsync,
  }

  const networkCapture: ForNetworkCapture = {
    notifyResponseStreamReceived: noopAsync,
    notifyResponseEndedWithEmptyBody: noop,
  }

  const cookieState: ForCookieState = {
    attachCrossOriginCookies: noopAsync,
    copyCookiesFromResponse: noopAsync,
  }

  const commandLog: ForCommandLog = {
    notifyIncomingRequest: noop,
    logInterception: (): CommandLogInterceptionResult => undefined,
  }

  const browserNetworkAutomation: ForBrowserNetworkAutomation = {}

  return {
    requestInterception,
    responseInterception,
    documentPreparation,
    networkCapture,
    cookieState,
    commandLog,
    browserNetworkAutomation,
  }
}

export type StubDrivenPorts = ReturnType<typeof createStubDrivenPorts>

export type StubRunPoliciesResult = RunPoliciesResult
