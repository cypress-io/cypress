import { KeyboardEvent } from 'react'

const INDENT_BASE = 5
const INDENT_AMOUNT = 15

function indent (level: number) {
  return INDENT_BASE + level * INDENT_AMOUNT
}

// Returns a keyboard handler that invokes the provided function when either enter or space is pressed
const onEnterOrSpace = (f: (() => void)) => {
  return (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      f()
    }
  }
}

export {
  indent,
  onEnterOrSpace,
}
