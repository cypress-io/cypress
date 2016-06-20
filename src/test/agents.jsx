import React from 'react'

const Agent = () => (
  <li className='hook-item'>
    <span className='hook-name'>
      <i className='fa fa-caret-right'></i>
      Spies / Stubs / Mocks (<span data-js='total'>0</span>)
      <i className='fa fa-ellipsis-h'></i>
    </span>
    <div className='agents-container hidden'>
      <div className='tab-content'>
        <div className='tab-pane active'>
          <table className='table table-condensed'>
            <thead>
              <tr>
                <th>Type</th>
                <th>Function</th>
                <th># Calls</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </li>
)

const Agents = () => (
  <div className='runnable-agents-region'>
    <div className='instruments-container' data-comment="hide if no agents">
      <ul className='hooks-container'>
        <Agent />
      </ul>
    </div>
  </div>
)

export default Agents
