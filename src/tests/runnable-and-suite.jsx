import cs from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import Test from './test'

const Suite = ({ model }) => (
  <div>
    <div className='runnable-wrapper' style={{ paddingLeft: model.indent }}>
      <div className='runnable-content-region'>
        <div>
          <div className='runnable-state'>
            <span className='suite-state'>
              <i className='fa fa-caret-down'></i>
            </span>
            <span className='suite-title'>
              {model.title}
              <i className='fa fa-ellipsis-h hidden'></i>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div className='runnables-region'>
      <ul className='runnables'>
        {_.map(model.children, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
      </ul>
    </div>
  </div>
)

class Runnable extends Component {
  constructor (props) {
    super(props)

    this.state = { isHovering: false }
  }

  render () {
    const { model } = this.props

    return (
      <li
        className={cs(`${model.type} runnable runnable-${model.state}`, {
          hover: this.state.isHovering,
        })}
        onMouseOver={this._hover(true)}
        onMouseOut={this._hover(false)}
      >
      {model.type === 'test' ? <Test model={model} /> : <Suite model={model} />}
    </li>
    )
  }

  _hover = (shouldHover) => (e) => {
    e.stopPropagation()
    this.setState({ isHovering: shouldHover })
  }
}

export default Runnable
