import os from 'os'
import { EventEmitter } from 'events'
import type { App } from 'electron'

import { makeDataContext } from '../makeDataContext'
import { makeGraphQLServer } from '../gui/makeGraphQLServer'
import { assertValidPlatform } from '@packages/types/src/platform'
import type { LaunchArgs } from '@packages/types'

export async function runInternalServer (launchArgs: LaunchArgs, mode: 'run' | 'open', electronApp?: App) {
  const bus = new EventEmitter()
  const platform = os.platform()

  assertValidPlatform(platform)

  const ctx = makeDataContext({
    mode,
    electronApp,
    os: platform,
    rootBus: bus,
    launchArgs,
  })

  ctx.emitter.init()

  // Initializing the data context, loading browsers, etc.
  const [gqlPort] = await Promise.all([
    makeGraphQLServer(ctx),
    ctx.initializeMode(),
  ])

  return { ctx, bus, gqlPort }
}
