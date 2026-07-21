import { instancesCommand } from './instances'
import { statusCommand } from './status'
import { domCommand } from './dom'
import { ariaCommand } from './aria'
import { inspectCommand } from './inspect'
import type { TapCliCommand } from '../types'

/**
 * The tap subcommands implemented entirely in the CLI, in the order they
 * appear in help output — ahead of the commands the running instance's
 * schema advertises.
 */
export const tapCliCommands: TapCliCommand[] = [instancesCommand, statusCommand, domCommand, ariaCommand, inspectCommand]
