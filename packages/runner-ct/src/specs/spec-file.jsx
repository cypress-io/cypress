import React from 'react'

function isActive (spec, activeSpec) {
  return activeSpec && spec.name === activeSpec
}

export function SpecFile(props) {
  return (
    <li 
      key={props.spec.name} 
      onClick={() => props.state.setSpec(props.spec.name)}
    >
      <i className={
        isActive(props.spec, props.state.spec?.name) 
        ? 'fas fa-check-square active' : 'far fa-square'} />
        {props.spec.shortName}
    </li>)
}
