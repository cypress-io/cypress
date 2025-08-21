import { type Writable } from 'stream'
import type { Debugger } from 'debug'
import { START_TAG, END_TAG } from './constants'
import { FilterPrefixedContent } from './FilterPrefixedContent'
import { FilterTaggedContent } from './FilterTaggedContent'
import { WriteToDebug } from './WriteToDebug'

const DISABLE_TAGS = process.env.ELECTRON_ENABLE_LOGGING === '1'

export function filter (stderr: Writable, debug: Debugger, prefix: RegExp, disableTags: boolean = false): Writable {
  const prefixTx = new FilterPrefixedContent(prefix, stderr)
  const tagTx = new FilterTaggedContent(START_TAG, END_TAG, stderr)
  const debugWriter = new WriteToDebug(debug)

  if (DISABLE_TAGS || disableTags) {
    prefixTx.pipe(debugWriter)
  } else {
    prefixTx.pipe(tagTx).pipe(debugWriter)
  }

  return prefixTx
}
