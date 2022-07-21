import cs from 'classnames'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

export interface Props {
  type: 'route' | 'agent' | 'dom' | 'primitive' | 'passed' | 'failed'
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
  if (!content) {
    return null
  }

  let tag = (
    <span className={cs('reporter-tag', 'reporter-tag-content', type, { 'reporter-tag-has-count': count }, customClassName)}>
      {content}
    </span>
  )

  if (count) {
    const customCountClass = customClassName ? `${customClassName}-count` : undefined

    tag = (
      <span>
        {tag}
        <span className={cs('reporter-tag', 'reporter-tag-count', type, customCountClass)}>{count}</span>
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
