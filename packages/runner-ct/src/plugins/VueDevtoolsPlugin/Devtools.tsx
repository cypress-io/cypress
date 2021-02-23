import * as React from 'react'
import { observer } from 'mobx-react'
import { nanoid } from 'nanoid'
import { State } from './state'

interface DevtoolsProps {
  state: State
}

export const Devtools: React.FC<DevtoolsProps> = observer(
  function Devtools (props) {
    const getComponents = () => {
      const aut = document.querySelector<HTMLIFrameElement>('.aut-iframe')!
      console.log(aut)
      aut.contentWindow.postMessage({ type: 'vue-devtools:request:components' }, '*')
    }

    return (
      <div>
        <p>Events</p>
        <ul>
          {
            props.state.events.map((event) => (
              <li key={event.uid}>
                {event.name}{' '}
                {event.payload.map((arg) => <span> ({JSON.stringify(arg)})</span>)}
              </li>
            ))
          }
        </ul>
        <hr />
        <button onClick={getComponents}>Components</button>
        <ul>
          {
            props.state.components.map((comp) => (
              <li key={comp._uid}>
                Name: {comp.name}
                <br />
                <span>Data:</span>
                {JSON.stringify(comp.data)}
              </li>
            ))
          }
        </ul>

      </div>
    )
  },
)
