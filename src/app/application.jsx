import { action, autorun } from 'mobx'
import { observer } from 'mobx-react'
import { Component } from 'react'
import { withRouter } from 'react-router'

import { getProjects } from '../projects/projects-api'

import ipc from '../lib/ipc'
import state from '../lib/state'

@withRouter
@observer
export default class Application extends Component {
  constructor (props) {
    super(props)

    ipc.getCurrentUser()
    .then(action('got:current:user', (user) => {
      state.userLoaded = true
      state.setUser(user)

      if (!user || !user.authToken) {
        this.props.router.push('/login')
      }
    }))
    .catch(ipc.isUnauthed, () => {
      this.props.router.push('/login')
    })

    autorun(() => {
      if (!state.userLoaded) return

      if (state.hasUser) {
        getProjects()
        this.props.router.push('/')
      } else {
        this.props.router.push('/login')
      }
    })
  }

  render () {
    return this.props.children
  }
}
