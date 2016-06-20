import React from 'react'

const Route = () => (
  <li className='hook-item'>
    <span className='hook-name'>
    <i className='fa fa-caret-right'></i>
    Routes (<span data-js='total'>0</span>)
    <i className='fa fa-ellipsis-h'></i>
    </span>
    <div className='server-container hidden'>
      <div className='tab-content'>
        <div className='tab-pane active'>
          <table className='table table-condensed'>
            <thead>
              <tr>
                <th>Method</th>
                <th>Url</th>
                <th>Stubbed</th>
                <th>Alias</th>
                <th title='Number of responses which matched this route'>#</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </li>
)

const Routes = () => (
  <div className='runnable-routes-region'>
    <div className='instruments-container' data-comment="hide if no routes">
      <ul className='hooks-container'>
        <Route />
      </ul>
    </div>
  </div>
)

export default Routes
