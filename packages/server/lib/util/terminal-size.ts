import termSize from 'term-size'
import * as env from './env'

export const get = (): { columns: number, rows: number } => {
  const obj = termSize()

  if (env.get('CI')) {
    // reset to 100
    obj.columns = 100
  }

  return obj
}
