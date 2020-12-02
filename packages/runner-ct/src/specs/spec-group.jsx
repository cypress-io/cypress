// @ts-check
import cs from 'classnames'
import React, { useState } from 'react'
import SpecFile from './spec-file'

export default function SpecGroup ({ groupKey, group, isActive, chooseSpec, parentPath = '' }) {
  const [isOpen, setOpen] = useState(true)

  return (<li key={groupKey} >
    <a onClick={() => setOpen(!isOpen)} >
      <i className={cs('far', isOpen ? 'fa-minus-square' : 'fa-plus-square')}/>
      {groupKey}
    </a>
    {isOpen && <ul>
      {Object.keys(group)
      .map((spec) =>
        group[spec].name
          ? <SpecFile
            key={spec}
            path={`${parentPath}/${groupKey}`}
            spec={group[spec]}
            active={isActive(group[spec])}
            chooseSpec={chooseSpec} />
          : <SpecGroup
            key={spec}
            groupKey={spec}
            group={group[spec]}
            parentPath={`${parentPath}/${groupKey}`}
            isActive={isActive}
            chooseSpec={chooseSpec} />)}
    </ul>}
  </li>)
}
