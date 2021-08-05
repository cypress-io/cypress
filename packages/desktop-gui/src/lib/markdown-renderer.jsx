import React from 'react'
import { MarkdownRenderer as UIMarkdownRenderer } from '@packages/ui-components'

import ipc from '../lib/ipc'

function clickHandler (e) {
  if (e.target.href) {
    e.preventDefault()

    return ipc.externalOpen(e.target.href)
  }
}

const MarkdownRenderer = ({ markdown, noParagraphWrapper }) => {
  return (
    <UIMarkdownRenderer noParagraphWrapper={noParagraphWrapper} clickHandler={clickHandler} markdown={markdown}/>
  )
}

export default MarkdownRenderer
