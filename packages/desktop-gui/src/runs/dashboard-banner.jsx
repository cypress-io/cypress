import _ from 'lodash'
import React from 'react'

const DashboardBanner = () => {
  return (
    <div className='dashboard-banner'>
      <div className='dashboard-banner-tr'>
        <div className='dashboard-banner-tr-title'>Test Runner</div>
        {_.map(['pass', 'fail', 'pass'], (test, i) => (
          <div key={`test-${i}`} className={`dashboard-banner-test ${test}`}>
            <div className='dashboard-banner-test-left'>
              <div className='dashboard-banner-test-title'>
                <div className='test-title-top'>
                  <i className={`fas ${test === 'pass' ? 'fa-check' : 'fa-times'}`} />
                  {_.capitalize(test)}ed test
                </div>
                <div className='test-title-bottom'>
                  <div className='fake-text' />
                  <div className='fake-text' />
                  <div className='fake-text' />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='dashboard-banner-connectors'>
        {_.map([2, 4, 3], (num, i) => (
          <div className='connector-row' key={`connector-row-${i}`}>
            {_.map(_.range(num), (x) => <div className='connector-bar' key={`connector-bar-${i}-${x}`} />)}
          </div>
        ))}
      </div>
      <div className='dashboard-banner-dashboard'>
        <div className='dashboard-banner-dashboard-title'>Cypress Dashboard</div>
        <div className='dashboard-banner-dashboard-content'>
          <div className='dashboard-banner-graph'>
            <div className='fake-text graph-title' />
            <div className='graph-bars'>
              {_.map(_.range(4), (i) => (
                <div className='graph-bar' key={`graph-bar-${i}`}>
                  <div className='graph-bar-section' />
                  <div className='graph-bar-section' />
                  <div className='graph-bar-section' />
                </div>
              ))}
            </div>
            <div className='fake-text graph-footer' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardBanner
