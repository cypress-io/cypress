import _ from 'lodash'
import React, { Component } from 'react'

export default class DashboardBanner extends Component {
  render () {
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
                    <div className='fake-text' style={{ width: '45px' }} />
                    <div className='fake-text' style={{ width: '60px' }} />
                    <div className='fake-text' style={{ width: '20px' }} />
                  </div>
                </div>
              </div>
              <div className='dashboard-banner-test-mid'>
                <i className='far fa-clock' />
                <div className='fake-text' style={{ width: '70px' }} />
              </div>
              <div className='dashboard-banner-test-end'>
                <i className='fas fa-hourglass-end' />
                <div className='fake-text' style={{ width: '60px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}
