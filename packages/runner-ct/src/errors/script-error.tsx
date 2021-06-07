import React from 'react'
import { namedObserver } from '../lib/mobx'
const ansiToHtml = require('ansi-to-html')

const convert = new ansiToHtml({
  fg: '#000',
  bg: '#fff',
  newline: false,
  escapeXML: true,
  stream: false,
})

export const ScriptError: React.FC<{ error: string }> = namedObserver('ScriptError', ({ error }) => {
  if (!error) {
    return null
  }

  const errorHTML = convert.toHtml(error)

  return (
    <pre
      className='script-error'
      dangerouslySetInnerHTML={{ __html: errorHTML }}
    />
  )
})

export default ScriptError
