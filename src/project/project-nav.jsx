import React, { Component } from 'react'
import Dropdown from '../dropdown/dropdown'
import { observer } from 'mobx-react'

@observer
export default class ProjectNav extends Component {
  render () {
    return (
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <div className="collapse navbar-collapse">
            <ul className="nav navbar-nav">
              <li>
                <a href="#">
                  <i className="fa fa-code"></i>{" "}
                  Tests
                </a>
              </li>
              <li>
                <a href="#">
                  <i className="fa fa-server"></i>{" "}
                  Builds
                </a>
              </li>
              <li>
                <a href="#">
                  <i className="fa fa-cog"></i>{" "}
                  Config
                </a>
              </li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
              <Dropdown
                className='browsers-list'
                chosen={{ name: 'chrome' }}
                others={[{ name: 'chrome' }]}
                onSelect={this._onSelect}
                renderItem={this._browser}
                keyProperty='name'
              />
            </ul>
          </div>
        </div>
      </nav>
    )
  }

  _onSelect = (browser) => {
    browser
  }

  _browser = (browser) => {
    browser
    return (
      <span>
        <i className={`fa fa-chrome`}></i>{' '}
        Chrome
        50
      </span>
    )
  }
}
