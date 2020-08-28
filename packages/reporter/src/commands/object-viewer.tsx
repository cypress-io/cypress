import React from 'react'
import _ from 'lodash'

interface ObjectViewerProps {
  obj: Record<any, any>
}

export const ObjectViewer = ({ obj }: ObjectViewerProps) => {
  return Object.keys(obj).length === 1
    ? (
      <div className="object-viewer">
        {`{ ${Object.keys(obj).map((key) => `${key}: ${encode(obj[key])}`).join('')} }`}
      </div>
    )
    : (
      <div>Show options</div>
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
