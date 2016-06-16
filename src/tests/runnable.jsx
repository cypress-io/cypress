import _ from 'lodash'
import React from 'react'
import Test from './test'

const Suite = ({ model }) => (
  <li className='suite runnable passed'>
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
  </li>
)

const Runnable = ({ model }) => (
  model.type === 'test' ? <Test model={model} /> : <Suite model={model} />
)

export default Runnable
