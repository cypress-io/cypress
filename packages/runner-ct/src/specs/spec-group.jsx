import cs from 'classnames'
import * as React from 'react'

function isActive (spec, stateStore) {
  return stateStore.runMode === 'multi'
    ? stateStore.multiSpecs.some((includedSpec) => includedSpec.absolute === spec.absolute)
    : spec.name === stateStore.spec?.name
}

function SpecFile ({ path, spec, state }) {
  return (
    <li
      key={spec.name}
      onClick={(e) =>
        e.shiftKey
          ? state.addSpecToMultiMode(spec)
          : state.setSingleSpec(spec)
      }
    >
      <i className={isActive(spec, state) ? 'fas fa-check-square active' : 'far fa-square'}/>
      {spec.name.slice(path.length)}
    </li>
  )
}

export function SpecGroup ({ group, groupKey, parentPath = '', state }) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <li key={groupKey} >
      <a onClick={() => setIsOpen(!isOpen)}>
        <i className={cs('far', isOpen ? 'fa-minus-square' : 'fa-plus-square')}/>
        {groupKey}
      </a>
      <ul className={cs(!isOpen && 'group-hidden')}>
        {Object.keys(group).map((spec) => {
          const newParentPath = `${parentPath}/${groupKey}`

          return group[spec].name
            ? (
              <SpecFile
                key={spec}
                path={newParentPath}
                state={state}
                spec={group[spec]}
              />
            ) : (
              <SpecGroup key={spec}
                groupKey={spec}
                group={group[spec]}
                state={state}
                parentPath={newParentPath}
              />
            )
        })}
      </ul>
    </li>
  )
}

export default SpecGroup
