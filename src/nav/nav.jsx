import { action } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import ProjectsList from './projects-list'
import state from '../lib/state'
import AppGlobal from '../lib/app'

const logout = () => {
  AppGlobal.ipc('log:out').then(action('log:out', () => {
    state.user = null
    AppGlobal.ipc('clear:github:cookies')
  }))
}

export default observer(() => (
  <nav className="navbar navbar-inverse">
    <div className="container-fluid">
      <ProjectsList />
      <div className="collapse navbar-collapse">
        <ul className="nav navbar-nav">
          <li>
            <a href="#">
              <i className="fa fa-plus"></i>
            </a>
          </li>
        </ul>
        <ul className="nav navbar-nav navbar-right">
          <li className="dropdown">
            <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
              <i className="fa fa-user"></i>{" "}
              {state.user.name}{" "}
              <span className="caret"></span>
            </a>
            <ul className="dropdown-menu">
              <li><a href="#">Billing</a></li>
              <li role="separator" className="divider"></li>
              <li><a href="#" onClick={logout}>Log Out</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
))
