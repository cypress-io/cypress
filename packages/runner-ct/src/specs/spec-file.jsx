import React, { useContext } from 'react'
import StateContext from './spec-context'

export default function SpecFile ({ path, spec }) {
  const { activeSpec, isActive, chooseSpec } = useContext(StateContext) || {}

  return (
    <li key={spec.name} onClick={chooseSpec(spec)}>
      <i className={isActive(spec, activeSpec) ? 'fas fa-check-square active' : 'far fa-square'}/>{spec.name.slice(path.length)}
    </li>)
}
