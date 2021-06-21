import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Loader from 'react-loader'
import gql from 'graphql-tag'
import { Query } from '@apollo/react-components'

import Intro from './intro'
import Layout from './layout'
import Project from '../project/project'
import { AppQueryDocument } from '../generated/graphql'

gql`
query AppQuery {
  app {
    cypressVersion
  }
  currentProject {
    id
    ...ActiveProject
  }
  recentProjects {
    ...ProjectListItem
  }
}
`

@observer
class App extends Component {
  componentDidMount () {
    // appApi.listenForMenuClicks()

    // ipc.getOptions().then((options = {}) => {
    //   updateStore.setVersion(options.version)
    //   appStore.set(_.pick(options, 'cypressEnv', 'os', 'projectRoot', 'proxySource', 'proxyServer', 'proxyBypassList'))
    //   viewStore.showApp()
    // })

    // authApi.loadUser()
  }

  render () {
    return (
      <Query query={AppQueryDocument}>
        {(result) => {
          if (result.loading) {
            return <Loader color='#888' scale={0.5} />
          }

          if (result.data.currentProject) {
            return (
              <Layout>
                <Project project={result.data.currentProject} />
              </Layout>
            )
          }

          return (
            <Layout>
              <Intro recentProjects={result.data.recentProjects} />
            </Layout>
          )
        }}
      </Query>
    )
  }
}

export default App
