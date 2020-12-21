import React from 'react'
import _ from 'lodash'
import Collapsible from '../collapsible/collapsible'

interface ObjectViewerProps {
  obj: Record<any, any>
  isOpen: boolean
}

export const ObjectViewer = ({ obj, isOpen }: ObjectViewerProps) => {
  return Object.keys(obj).length === 1 && !_.isObject(obj[Object.keys(obj)[0]])
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
        <pre>{JSON.stringify(obj, null, 4)}</pre>
      </Collapsible>
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
