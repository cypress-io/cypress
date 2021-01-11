import * as React from 'react'
import { observer } from 'mobx-react'
import State from '../lib/state'
import { SpecFile as SF } from './make-spec-hierarchy'

interface SpecFileProps {
  state: State,
  // eslint-disable-next-line
  spec: SF
}

export const SpecFile = observer(
  function SpecFile ({ spec, state }: SpecFileProps) {
    const isActive = state.runMode === 'multi'
      ? state.multiSpecs.some((includedSpec) => includedSpec.absolute === spec.absolute)
      : spec.name === state.spec?.name

    return (
      <li
        key={spec.name}
        className="spec-list-file"
        onClick={(e) =>
          e.shiftKey
            ? state.addSpecToMultiMode(spec)
            : state.setSingleSpec(spec)
        }
      >
        {state.runMode === 'single'
          ? <input className="spec-list-radio" type="radio" checked={isActive} readOnly/>
          : <i className={isActive ? 'fas fa-check-square active' : 'far fa-square'} />
        }

        {spec.shortName}
      </li>)
  },

)
