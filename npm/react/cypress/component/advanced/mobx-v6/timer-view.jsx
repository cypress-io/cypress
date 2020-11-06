import React from 'react'
import { observer } from 'mobx-react-lite'

// A function component wrapped with `observer` will react
// to any future change in an observable it used before.
export const TimerView = observer(({ timer }) => (
  <span>Seconds passed: {timer.secondsPassed}</span>
))
