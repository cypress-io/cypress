import { TAP_NATIVE_COMMANDS } from '@packages/cypress-instances'
import type { TapNativeCommandName } from '@packages/cypress-instances'
import type { TapCliCommand } from '../types'

// Pairs a CLI-native command's declarative schema — sourced from the shared
// TAP_NATIVE_COMMANDS contract so it can't drift from the help it renders — with
// its CLI-side handler. Mirrors the app's defineCommand for schema commands.
export const defineNativeCommand = (name: TapNativeCommandName, handler: TapCliCommand['handler']): TapCliCommand => {
  const meta = TAP_NATIVE_COMMANDS.find((command) => command.name === name)!

  return { ...meta, handler }
}
