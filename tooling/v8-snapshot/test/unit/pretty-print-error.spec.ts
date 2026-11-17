import { expect } from 'chai'
import { stripVTControlCharacters } from 'util'
import { prettyPrintError } from '../../src/utils'

const SNAPSHOT_FRAME = '    at Object.__commonJS../node_modules/mute-stream/mute.js (/Volumes/d/dev/cy/perf-tr1/v8-snapshot/example-multi/cache/snapshot.js:10555:43)'
const OTHER_FRAME = '    at Module._compile (node:internal/modules/cjs/loader:1554:14)'

const printed = (err: Error) => {
  const calls: unknown[][] = []
  // eslint-disable-next-line no-console
  const original = console.error

  // eslint-disable-next-line no-console
  console.error = (...args: unknown[]) => {
    calls.push(args.map((arg) => typeof arg === 'string' ? stripVTControlCharacters(arg) : arg))
  }

  try {
    prettyPrintError(err, '/project')
  } finally {
    // eslint-disable-next-line no-console
    console.error = original
  }

  return calls
}

const errorWithStack = (stack: string) => {
  const err = new Error('boom')

  err.stack = stack

  return err
}

describe('prettyPrintError', () => {
  it('highlights snapshot module frames and lists their require definitions', () => {
    const calls = printed(errorWithStack(['Error: boom', SNAPSHOT_FRAME, OTHER_FRAME].join('\n')))

    expect(calls).to.deep.equal([
      ['boom'],
      [[
        'Error: boom',
        'at Object.__commonJS. ./node_modules/mute-stream/mute.js(/Volumes/d/dev/cy/perf-tr1/v8-snapshot/example-multi/cache/snapshot.js:10555)',
        OTHER_FRAME,
      ].join('\n')],
      ['\nRequire Definitions Stack:'],
      ['  %s', './node_modules/mute-stream/mute.js at snapshot:10555 (/project/node_modules/mute-stream/mute.js)'],
    ])
  })

  it('reads the whole line number when the frame has no column', () => {
    const calls = printed(errorWithStack([
      'Error: boom',
      '    at Object.__commonJS../node_modules/a/index.js (/cache/snapshot.js:7)',
    ].join('\n')))

    expect(calls[1]).to.deep.equal([[
      'Error: boom',
      'at Object.__commonJS. ./node_modules/a/index.js(/cache/snapshot.js:7)',
    ].join('\n')])

    expect(calls[3]).to.deep.equal(['  %s', './node_modules/a/index.js at snapshot:7 (/project/node_modules/a/index.js)'])
  })

  it('handles several snapshot frames in one stack', () => {
    const calls = printed(errorWithStack([
      'Error: boom',
      '    at Object.__commonJS../node_modules/a/index.js (/cache/snapshot.js:12:3)',
      '    at Object.__commonJS../node_modules/b/lib/b.js (/cache/snapshot.js:345:67)',
    ].join('\n')))

    expect(calls[3]).to.deep.equal([
      '  %s',
      [
        './node_modules/a/index.js at snapshot:12 (/project/node_modules/a/index.js)',
        './node_modules/b/lib/b.js at snapshot:345 (/project/node_modules/b/lib/b.js)',
      ].join('\n  '),
    ])
  })

  it('prints the error unchanged when no frame comes from a snapshot module', () => {
    const err = errorWithStack(['Error: boom', OTHER_FRAME].join('\n'))

    expect(printed(err)).to.deep.equal([[err]])
  })

  it('does not treat a frame without a snapshot location as a snapshot module frame', () => {
    const err = errorWithStack(['Error: boom', '    at Object.__commonJS../node_modules/a/index.js'].join('\n'))

    expect(printed(err)).to.deep.equal([[err]])
  })
})
