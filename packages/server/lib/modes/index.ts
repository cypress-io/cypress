import { OptionsArgv, RunMode } from '../util/args'

export function modeDispatch(mode: RunMode, options: OptionsArgv) {
  switch (mode) {
    case 'record':
      return require('./record').run(options)
    case 'run':
      return require('./run').run(options)
    case 'interactive':
      return require('./interactive').run(options)
  }
}
