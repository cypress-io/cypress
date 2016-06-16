import _ from 'lodash'
import React from 'react'
import Hook from './hook'

const NoCommands = () => (
  <div className='no-commands'>
    No commands were issued in this test.
  </div>
)

const Hooks = ({ model }) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => <Hook key={hook.id} model={hook} />)}
  </ul>
)

const hasCommands = (hooks) => !!_.flatMap(hooks, 'commands').length

const Test = ({ model }) => (
  <li className='test runnable passed'>
    <div className='runnable-wrapper' style={{ paddingLeft: model.indent }}>
      <div className='runnable-content-region'>
        <div>
          <div className='runnable-state'>
            <span className='test-state'>
              <i className='fa'></i>
            </span>
            <span className='test-title'>{model.title}</span>
          </div>
          <div className='runnable-controls'>
            <i className='fa fa-warning'></i>
          </div>
        </div>
      </div>
      <div className='runnable-instruments'>
        <div className='runnable-agents-region'>
          <div className='instruments-container' style={{ display: 'none' }}>
            <ul className='hooks-container'>
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
            </ul>
          </div>
        </div>
        <div className='runnable-routes-region'>
          <div className='instruments-container' style={{ display: 'none' }}>
            <ul className='hooks-container'>
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
            </ul>
          </div>
        </div>
        <div className='runnable-commands-region'>
          {hasCommands(model.hooks) ? <Hooks model={model} /> : <NoCommands />}
        </div>
      </div>
      <span className='hook'></span>
      <pre className='test-error'></pre>
    </div>
  </li>
)

export default Test
