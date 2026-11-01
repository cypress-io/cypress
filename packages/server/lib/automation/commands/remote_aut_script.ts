import { getRunnerRemoteAutInjectionContents } from '@packages/resolve-dist'
import { REMOTE_AUT_API } from '@packages/types'
import type { RemoteAutCall, RemoteAutScriptConfig, RemoteAutScriptSettings } from '@packages/types'

// The remote driver's script for the main world of every frame of the runner's tab, built from
// packages/runner/injection/remote-aut.ts. It marks synchronous XHRs, since the AUT shares the
// runner's thread and one would block the driver from answering a cy.intercept route handler,
// gives a cross-origin AUT the cookies it would have as top, and with reportErrors reports the
// AUT's uncaught errors.
export const getRemoteAutScript = async (config: RemoteAutScriptConfig, { reportErrors }: { reportErrors: boolean }) => {
  const bundle = await getRunnerRemoteAutInjectionContents()
  const settings: RemoteAutScriptSettings = { ...config, reportErrors }

  return `(function (cypressRemoteAutConfig) {\n${bundle}\n}(${JSON.stringify(settings)}))`
}

// an AUT that is loading has no script to call yet, and starts with the server's cookies and unpaused timers
export const callRemoteAut = async (evaluateInAut: (expression: string) => Promise<unknown>, { method, args }: RemoteAutCall) => {
  await evaluateInAut(`window[${JSON.stringify(REMOTE_AUT_API)}]?.${method}(...${JSON.stringify(args)})`).catch(() => {})
}
