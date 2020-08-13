import _ from 'lodash'
import React from 'react'

const DashboardBanner = () => {
  return (
    <div className='dashboard-banner'>
      <div className='left-vector' />
      <div className='right-vector' />
      <div className='dashboard-banner-db'>
        {_.map(['pass', 'fail', 'pass'], (test, i) => (
          <div key={`test-${i}`} className={`dashboard-banner-test ${test}`}>
            <div className='dashboard-banner-test-left'>
              <div className='dashboard-banner-test-title'>
                <div className='test-title-top'>
                  <i className='fas fa-check' />
                  {_.capitalize(test)}ed test
                </div>
                <div className='test-title-bottom'>
                  <div className='fake-text' />
                  <div className='fake-text' />
                  <div className='fake-text' />
                </div>
              </div>
            </div>
            <div className='dashboard-banner-test-mid'>
              <i className='far fa-clock' />
              <div className='fake-text' />
            </div>
            <div className='dashboard-banner-test-end'>
              <i className='fas fa-hourglass-end' />
              <div className='fake-text' />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardBanner
