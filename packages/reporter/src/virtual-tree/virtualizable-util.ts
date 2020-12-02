import { useEffect } from 'react'
import { autorun } from 'mobx'
import { VirtualizableProps } from './virtualizable-types'

export const measureOnChange = (virtualizableProps: VirtualizableProps, autorunFn: Function) => {
  useEffect(() => {
    const disposeAutorun = autorun(() => {
      autorunFn()

      virtualizableProps.measure()
    })

    return () => {
      disposeAutorun()
    }
  }, [true])
}
