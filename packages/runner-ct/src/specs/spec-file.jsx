import React from 'react'

export default function SpecFile ({ path, spec, active, chooseSpec }) {
  return (<li key={spec.name} onClick={chooseSpec(spec)}>
    <i className={active ? 'fas fa-check-square active' : 'far fa-square'}/>{spec.name.slice(path.length)}
  </li>)
}
