import React from 'react'

function isActive (spec, activeSpec) {
  return activeSpec && spec.name === activeSpec?.name
}

export function SpecFile ({ spec, state }) {
  return (
    <li
      key={spec.name}
      onClick={() => state.setSpec(spec)}
    >
      <i className={
        isActive(spec, state.spec)
          ? 'fas fa-check-square active' : 'far fa-square'} />
      {spec.shortName}
    </li>)
}
