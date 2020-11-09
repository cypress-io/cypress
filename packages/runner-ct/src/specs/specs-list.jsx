import { observer } from 'mobx-react'
import React, { Component } from 'react'
import specsStore from './specs-store'

@observer
class SpecsList extends Component {
  render () {
    return (
      <div className="specs-list">
        List of Specs:
        <ul>
          {specsStore.specs.map((spec) => {
            return (<li key={spec.name} onClick={this.chooseSpec(spec)}>
              <input type="checkbox" />{spec.name}
            </li>)
          })}
        </ul>
      </div>
    )
  }

  chooseSpec (spec) {
    return () => {
      this.props.state.setSpec(spec)
    }
  }
}

export default SpecsList
