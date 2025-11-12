import terminalSize from 'terminal-size'
import * as env from './env'

export const get = (): { columns: number, rows: number } => {
  const obj = terminalSize()

  if (env.get('CI')) {
    // reset to 100
    obj.columns = 100
  }

  return obj
}
