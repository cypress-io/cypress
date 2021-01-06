import React, { useRef, useEffect } from 'react'
import _ from 'lodash'
import Prism from 'prismjs'

import Collapsible from '../collapsible/collapsible'

interface ObjectViewerProps {
  obj: Record<any, any>
  isOpen: boolean
}

export const ObjectViewer = ({ obj, isOpen }: ObjectViewerProps) => {
  const isSingleObjValue = Object.keys(obj).length === 1 && !_.isObject(obj[Object.keys(obj)[0]])

  return isSingleObjValue
    ? (
      <div className="object-viewer">
        {`{ ${Object.keys(obj).map((key) => `${key}: ${encode(obj[key])}`).join('')} }`}
      </div>
    )
    : (
      <Collapsible
        header={{
          collapsed: 'Show options',
          expanded: 'Hide options',
        }}
        isOpen={isOpen}
      >
        <JsonCode obj={obj} />
      </Collapsible>
    )
}

interface JsonCodeProps {
  obj: Record<any, any>
}

const JsonCode = ({ obj }: JsonCodeProps) => {
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (ref.current) {
      Prism.highlightAllUnder(ref.current)
    }
  })

  return (
    <pre ref={ref}>
      <code className='language-json'>{JSON.stringify(obj, null, 4)}</code>
    </pre>
  )
}

const encode = (val: any) => {
  if (_.isObject(val)) {
    return JSON.stringify(val).replace(/,"/g, ', "')
  }

  if (_.isFunction(val)) {
    return '[Function]'
  }

  return val
}
