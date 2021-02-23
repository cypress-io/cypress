import * as React from 'react'
import { observer } from 'mobx-react'
import { nanoid } from 'nanoid'
import { State } from './state'

interface DevtoolsProps {
  state: State
}

export const Devtools: React.FC<DevtoolsProps> = observer(
  function Devtools (props) {
    return (
      <div>
        <p>Events</p>
        <ul>
          {
            props.state.events.map(event => (
              <li key={event.uid}>
                {event.name}
                <div>Args:</div>
                <ul>
                  {event.payload.map(arg => <li key={nanoid()}>{JSON.stringify(arg)}</li>)}
                </ul>
              </li>
            ))
          }
        </ul>
      </div>
    )
  }
)
