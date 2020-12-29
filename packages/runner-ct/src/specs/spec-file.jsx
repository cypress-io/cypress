import React from 'react'
import { observer } from 'mobx-react'

function isActive (spec, stateStore) {
  return stateStore.runMode === 'multi'
    ? stateStore.multiSpecs.some((includedSpec) => includedSpec.absolute === spec.absolute)
    : spec.name === stateStore.spec?.name
}

export const SpecFile = observer(function SpecFile ({ spec, state }) {
  return (
    <li
      key={spec.name}
      onClick={(e) =>
        e.shiftKey
          ? state.addSpecToMultiMode(spec)
          : state.setSingleSpec(spec)
      }
    >
      <i className={
        isActive(spec, state)
          ? 'fas fa-check-square active' : 'far fa-square'} />
      {spec.shortName}
    </li>)
})
