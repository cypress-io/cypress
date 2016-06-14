import React from 'react'

const count = (num) => num > 0 ? num : '--'

export default (props) => (
  <ul className='stats'>
    <li className='passed'>
      <i className='fa fa-check'></i>
      <span className='num'>{count(props.passed)}</span>
    </li>
    <li className='failed'>
      <i className='fa fa-times'></i>
      <span className='num'>{count(props.failed)}</span>
    </li>
    <li className='pending'>
      <i className='fa fa-circle-o-notch'></i>
      <span className='num'>{count(props.pending)}</span>
    </li>
    <li className='duration'>
      <span className='num'>{count(props.duration)}</span>
    </li>
  </ul>
)
