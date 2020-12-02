// @ts-check
import cs from 'classnames'
import React, { useState } from 'react'
import SpecFile from './spec-file'

export default function SpecGroup ({ groupKey, group, parentPath = '' }) {
  const [isOpen, setOpen] = useState(true)

  return (<li key={groupKey} >
    <a onClick={() => setOpen(!isOpen)} >
      <i className={cs('far', isOpen ? 'fa-minus-square' : 'fa-plus-square')}/>
      {groupKey}
    </a>
    <ul className={cs(!isOpen && 'group-hidden')}>
      {Object.keys(group)
      .map((spec) =>
        group[spec].name
          ? <SpecFile
            key={spec}
            path={`${parentPath}/${groupKey}`}
            spec={group[spec]}/>
          : <SpecGroup
            key={spec}
            groupKey={spec}
            group={group[spec]}
            parentPath={`${parentPath}/${groupKey}`}/>)}
    </ul>
  </li>)
}
