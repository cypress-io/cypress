import React, { Component } from 'react'
import { observer } from 'mobx-react'

import App from '../lib/app'
import updater from './update-model'

const openChangelog = (e) => {
  e.preventDefault()
  return App.ipc('external:open', 'https://on.cypress.io/changelog')
}

@observer
class Updates extends Component {
  constructor (props) {
    super(props)

    updater.setVersion(props.options.version)

    App.ipc("updater:run", (err, data = {}) => {
      switch (data.event) {
        case "start":
          return updater.setState("checking")
        case "apply":
          return updater.setState("applying")
        case "error":
          return updater.setState("error")
        case "done":
          return updater.setState("done")
        case "none":
          return updater.setState("none")
        case "download":
          updater.setNewVersion(data.version)
          return updater.setState("downloading")
        default:
          return
      }
    })
  }

  render () {
    return (
      <div>
        <p>
          <a onClick={openChangelog} href="#">
            View Changelog
          </a>
        </p>
        { this._currentVersion() }
        { this._newVersion() }
        { this._state() }
      </div>
    )
  }

  _currentVersion = () => {
    if (updater.version) {
      return (
        <p class="version">
          <b>Current Version:</b>{' '}
          <span>{ updater.version }</span>
        </p>
      )
    }
  }

  _newVersion = () => {
    if (updater.newVersion) {
      return (
        <p class="new-version">
          <b>New Version:</b>{' '}
          <span>{ updater.newVersion }</span>
        </p>
      )
    }
  }

  _state = () => {
    if (updater.state) {
      return (
        <p class="state">
          {
          //   <% if not @finished: %>
          //     <i class="fa fa-spinner fa-spin"></i>
          //   <% end %>
          //   <%= @stateFormatted %>
          // </p>
          // <% if @finished: %>
          //   <div>
          //     <button class="btn btn-default"><%= @buttonFormatted %></button>
          //   </div>
          // <% end %>
          }
        </p>
      )
    }
  }
}

export default Updates
