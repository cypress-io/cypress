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
      state.setUser(user)
    }))

    autorun(() => {
      if (state.hasUser) {
        getProjects()
        this.props.router.push('/')
      } else {
        // hack to keep react happy about changing routes
        // in the middle of rendering
        setTimeout(() => this.props.router.push('/login'))
      }
    })
  }

  render () {
    return this.props.children
  }
}
