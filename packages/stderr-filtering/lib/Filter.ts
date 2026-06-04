import type { Writable } from 'stream'
import type { Debugger } from 'debug'
import { START_TAG, END_TAG } from './constants'
import { FilterPrefixedContent } from './FilterPrefixedContent'
import { FilterTaggedContent } from './FilterTaggedContent'
import { WriteToDebug } from './WriteToDebug'
import { tagsDisabled } from './tagsDisabled'

export function filter (stderr: Writable, debug: Debugger, prefix: RegExp): Writable {
  const prefixTx = new FilterPrefixedContent(prefix, stderr)
  const debugWriter = new WriteToDebug(debug)

  if (tagsDisabled()) {
    prefixTx.pipe(debugWriter)
  } else {
    const tagTx = new FilterTaggedContent(START_TAG, END_TAG, stderr)

    prefixTx.pipe(tagTx).pipe(debugWriter)
  }

  return prefixTx
}
