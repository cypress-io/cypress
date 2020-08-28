import React from 'react'
import _ from 'lodash'

interface ObjectViewerProps {
  obj: Record<any, any>
}

export const ObjectViewer = ({ obj }: ObjectViewerProps) => {
  return (
    <div className="object-viewer">
      {Object.keys(obj).map((key) => {
        return <div>{`- ${key}: ${encode(obj[key])}`}</div>
      })}
    </div>
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
