import cs from 'classnames'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

export interface Props {
  type: 'route' | 'agent' | 'dom' | 'primitive' | 'creating' | 'created' | 'restoring' | 'restored' | 'recreating' | 'recreated' | 'fail'
  content: React.Component | string
  count?: number
  tooltipMessage?: React.Component | string
  customClassName?: string
}

const Tag = ({
  content,
  count,
  customClassName,
  tooltipMessage,
  type,
}: Props) => {
  let tag = (
    <span className={cs('reporter-tag', type, { 'reporter-tag-has-count': count }, customClassName)}>
      {content}
    </span>
  )

  if (count) {
    const customCountClass = customClassName ? `${customClassName}-count` : undefined

    tag = (
      <span>
        {tag}
        <span className={cs('reporter-tag-count', type, customCountClass)}>{count}</span>
      </span>
    )
  }

  if (!tooltipMessage) {
    return tag
  }

  return (
    <Tooltip placement='top' title={tooltipMessage} className='cy-tooltip'>
      {tag}
    </Tooltip>
  )
}

export default Tag
