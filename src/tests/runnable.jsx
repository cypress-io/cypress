import _ from 'lodash'
import React from 'react'
import Test from './test'

const Suite = ({ children, indent, title }) => (
  <li className='suite runnable passed'>
    <div className='runnable-wrapper' style={{ paddingLeft: indent }}>
      <div className='runnable-content-region'>
        <div>
          <div className='runnable-state'>
            <span className='suite-state'>
              <i className='fa fa-caret-down'></i>
            </span>
            <span className='suite-title'>
              {title}
              <i className='fa fa-ellipsis-h hidden'></i>
            </span>
          </div>
          <div className='runnable-controls'></div>
        </div>
      </div>
    </div>
    <div className='runnables-region'>
      <ul className='runnables'>
        {_.map(children, (child) => <Runnable key={child.id} {...child} />)}
      </ul>
    </div>
  </li>
)

const Runnable = (props) => (
  props.type === 'test' ? <Test {...props} /> : <Suite {...props} />
)

export default Runnable
