import { action, autorun } from 'mobx'
import { observer } from 'mobx-react'
import { Component } from 'react'
import { withRouter } from 'react-router'

import { getProjects } from '../projects/projects-api'

import App from '../lib/app'
import state from '../lib/state'

@withRouter
@observer
export default class Application extends Component {
  constructor (props) {
    super(props)

    App.ipc('get:current:user')
    .then(action('got:current:user', (user) => {
      state.userLoaded = true
      state.setUser(user)
    }))

    autorun(() => {
      if (!state.userLoaded) return

      getProjects()
    })
  }

  render () {
    return this.props.children
  }
}
