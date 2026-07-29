import { TAP_NATIVE_COMMANDS } from '@packages/cypress-instances'
import type { TapCommandOptionSchema, TapCommandParamSchema, TapNativeCommandName, TapRawOptions, TapRawParams } from '@packages/cypress-instances'
import type { TapCliCommand, TapCliOptions } from '../types'

type NativeByName<N extends TapNativeCommandName> = Extract<typeof TAP_NATIVE_COMMANDS[number], { name: N }>

// A native meta omits params/options it doesn't declare, so an absent key types
// as none rather than never.
type ParamsOf<C> = C extends { params: readonly TapCommandParamSchema[] } ? C['params'] : readonly []
type OptionsOf<C> = C extends { options: readonly TapCommandOptionSchema[] } ? C['options'] : readonly []

/**
 * Authoring helper for one CLI-native tap subcommand. The command's declarative
 * schema lives in the shared TAP_NATIVE_COMMANDS contract so it can't drift from
 * the help it renders; this pairs that metadata with the CLI-side handler and
 * types the handler against the named entry, mirroring the app's defineCommand —
 * no annotations, `handler: (options, { spec }) => …`.
 */
export const defineNativeCommand = <N extends TapNativeCommandName>(
  name: N,
  handler: (
    options: TapCliOptions,
    args: TapRawParams<ParamsOf<NativeByName<N>>>,
    commandOptions: TapRawOptions<OptionsOf<NativeByName<N>>>,
  ) => Promise<number>,
): TapCliCommand & { name: N } => {
  const meta = TAP_NATIVE_COMMANDS.find((command) => command.name === name)!

  return { ...meta, name, handler }
}
