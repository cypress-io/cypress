import os from 'os'
import { EventEmitter } from 'events'
import type { App } from 'electron'

import { makeDataContext } from '../makeDataContext'
import { makeGraphQLServer } from '../gui/makeGraphQLServer'
import { assertValidPlatform } from '@packages/types/src/platform'
import { DataContext, getCtx, setCtx } from '@packages/data-context'

export function runInternalServer (launchArgs, _internalOptions = { loadCachedProjects: true }, electronApp?: App) {
  const bus = new EventEmitter()
  const platform = os.platform()

  assertValidPlatform(platform)

  let ctx: DataContext

  try {
    ctx = getCtx()
  } catch {
    ctx = setCtx(makeDataContext(launchArgs))
  }

  // Initializing the data context, loading browsers, etc.
  ctx.initializeData()
  ctx.emitter.init()

  const serverPortPromise = makeGraphQLServer(ctx)

  return { ctx, bus, serverPortPromise }
}
