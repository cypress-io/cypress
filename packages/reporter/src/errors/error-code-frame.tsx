import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react'
import Prism from 'prismjs'

import type { CodeFrame } from './err-model'
import FileNameOpener from '../lib/file-name-opener'

interface Props {
  codeFrame: CodeFrame
}

const ErrorCodeFrame: React.FC<Props> = observer(({ codeFrame }) => {
  const codeFrameRef = useRef<null | HTMLPreElement>(null)

  const { line, frame, language } = codeFrame

  // since we pull out 2 lines above the highlighted code, it will always
  // be the 3rd line unless it's at the top of the file (lines 1 or 2)
  const highlightLine = Math.min(line, 3)

  useEffect(() => {
    Prism.highlightAllUnder(codeFrameRef.current as unknown as ParentNode)
  }, [])

  return (
    <div className='test-err-code-frame'>
      <FileNameOpener className="runnable-err-file-path" fileDetails={codeFrame} hasIcon />
      <pre ref={codeFrameRef} data-line={highlightLine}>
        <code className={`language-${language || 'text'}`}>{frame}</code>
      </pre>
    </div>
  )
})

export default ErrorCodeFrame
