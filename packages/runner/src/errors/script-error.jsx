import { observer } from 'mobx-react'
import React from 'react'
const ansiToHtml = require('ansi-to-html')

const convert = new ansiToHtml({
  fg: '#000',
  bg: '#fff',
  newline: false,
  escapeXML: true,
  stream: false,
})
const ScriptError = observer(({ error }) => {
  if (!error) return null

  const errorHTML = convert.toHtml(error.error)

  return (
    <pre className='script-error' dangerouslySetInnerHTML={{ __html: errorHTML }}>
    </pre>
  )
})

export default ScriptError
