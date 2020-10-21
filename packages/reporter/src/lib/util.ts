import _ from 'lodash'
import { CSSProperties, KeyboardEvent } from 'react'

const INDENT_BASE = 5
const INDENT_AMOUNT = 15

export const indent = (level: number) => {
  return INDENT_BASE + level * INDENT_AMOUNT
}

export const indentPadding = (style: CSSProperties, level: number) => {
  return _.extend({}, style, { paddingLeft: indent(level) })
}

// Returns a keyboard handler that invokes the provided function when either enter or space is pressed
export const onEnterOrSpace = (f: (() => void)) => {
  return (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      f()
    }
  }
}
