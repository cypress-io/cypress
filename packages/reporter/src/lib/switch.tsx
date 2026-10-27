import { observer } from 'mobx-react'
import React, { useCallback } from 'react'

interface Props {
  value: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  'data-cy'?: string
  onUpdate: (e: React.MouseEvent<HTMLButtonElement>) => void
}

const Switch: React.FC<Props> = observer(({ value, 'data-cy': dataCy, size = 'lg', onUpdate }) => {
  const _onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onUpdate(e)
  }, [onUpdate])

  return (
    <button
      data-cy={dataCy}
      className={`switch switch-${size}`}
      role="switch"
      aria-checked={value}
      onClick={_onClick}
    >
      <span className="indicator" />
    </button>
  )
})

Switch.displayName = 'Switch'

export default Switch
