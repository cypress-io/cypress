import type webpack from 'webpack'

// `Error: boom\n    at foo (a.js:1:1)` becomes `Error: boom`: each stack frame line is
// dropped together with the newline and any blank lines in front of it.
// `\n\s*` is greedy and the frame is optional, so a whitespace run that isn't
// followed by `at` is consumed once and kept, instead of being rescanned from
// every newline inside it.
const STACK_FRAME = /\n\s*(at.*)?/g

const PREVIOUS_EVENT = /From previous event:\n?/g

export function cleanseError (err: string | webpack.StatsError) {
  const msg = typeof err === 'string' ? err : err.message

  return msg
  .replace(STACK_FRAME, (match, frame?: string) => frame === undefined ? match : '')
  .replace(PREVIOUS_EVENT, '')
}
