import type {
  CommandLogInterceptionResult,
  ForCommandLog,
  ForCookieState,
  ForDocumentPreparation,
  ForNetworkCapture,
} from '../ports/driven-ports'
import type { ForInterceptionEvents } from '../ports/interception-events'

/** No-op driven ports for HTTP/2 browser-adapter unit tests and future composition roots. */
export function createStubDrivenPorts () {
  const noopAsync = async () => {}
  const noop = () => {}

  const interceptionEvents: ForInterceptionEvents = {
    emitAndAwait: async () => ({}),
    emit: noop,
    resolveEventHandler: noop,
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

  return {
    interceptionEvents,
    documentPreparation,
    networkCapture,
    cookieState,
    commandLog,
  }
}
