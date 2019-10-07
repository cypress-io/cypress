import _ from 'lodash'
import debugModule from 'debug'
import esprima = require('esprima')
import { Node } from 'estree'

export type RewriteNodeFn = (js: string, node: Node, meta: any) => string | undefined

type Splice = {
  start: number
  end: number
  contents: string
}

const debug = debugModule('cypress:rewriter:js')

export function rewriteJs (js: string, rewriteNodeFn: RewriteNodeFn) {
  const splices : Splice[] = []

  try {
    esprima.parseScript(js, {
      comment: true,
      range: true,
      tolerant: true,
      tokens: true,
    }, (node, meta) => {
      const newContents = rewriteNodeFn(js, node, meta)

      if (!_.isUndefined(newContents)) {
        splices.push({
          start: meta.start.offset,
          end: meta.end.offset,
          contents: newContents,
        })
      }
    })
  } catch (err) {
    debug('got an error rewriting JS, returning unmodified %o', { err, js })

    return js
  }

  let lastSpliceStart = js.length

  splices
  // splice from the end backwards so indices don't shift as we go
  .sort((a, b) => b.end - a.end)
  .forEach(({ start, end, contents }) => {
    if (end > lastSpliceStart) {
      return
    }

    lastSpliceStart = start
    js = js.slice(0, start) + contents + js.slice(end)
  })

  return js
}
