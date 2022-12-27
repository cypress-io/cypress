import cs from 'classnames'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

export interface Props {
  type?: 'agent' | 'count' | 'dom' | 'failed-status' | 'primitive' | 'route' | 'successful-status'
  content: React.ReactNode | string
  count?: number
  tooltipMessage?: React.ReactNode | string
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

  let tagContent = (
    <span className={cs('reporter-tag', 'reporter-tag-content', type, { 'reporter-tag-has-count': count }, customClassName)}>
      {content}
    </span>
  )

  if (count) {
    const customCountClass = customClassName ? `${customClassName}-count` : undefined

    tagContent = (
      <span>
        {tagContent}
        <span className={cs('reporter-tag', 'reporter-tag-count', type, customCountClass)}>{count}</span>
      </span>
    )
  }

  if (!tooltipMessage) {
    return tagContent
  }

  return (
    <Tooltip placement='top' title={tooltipMessage} className='cy-tooltip'>
      {tagContent}
    </Tooltip>
  )
}

export default Tag
