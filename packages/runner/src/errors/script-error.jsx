import { observer } from 'mobx-react'
import React from 'react'

const ScriptError = observer(({ error }) => {
  if (!error) return null

  return (
    <pre className='script-error'>
      {error.error.replace(/\{newline\}/g, '\n')}
    </pre>
  )
})

export default ScriptError
