import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'
import Collapse, { Panel } from 'rc-collapse'
import { isEmpty } from 'lodash'

import Configuration from './configuration'
import ProjectId from './project-id'
import RecordKey from './record-key'
import ProxySettings from './proxy-settings'
import NodeVersion from './node-version'
import FilePreference from './file-preference'
import Experiments from './experiments'

import { getExperiments, experimental } from '@packages/server/lib/experiments'

if (window.Cypress) {
  // expose object to allow stubbing experimental data during tests
  window.experimental = experimental
}

const Settings = observer(({ project, app }) => {
  const { resolvedNodeVersion } = project
  const experiments = getExperiments(project)
  const hasExperiments = !isEmpty(experiments)

  return (
    <div className={cs('settings', {
      'show-project-id': !!project.id,
      'show-record-key': project.isSetupForRecording,
    })}>
      <div className='settings-wrapper'>
        <Collapse>
          <Panel header='Configuration' key='config' className='form-horizontal settings-config'>
            <Configuration project={project} />
          </Panel>
          <Panel header='Project ID' key='project-id' className='form-horizontal settings-project-id'>
            <ProjectId project={project} />
          </Panel>
          <Panel header='Record Key' key='record-key' className='form-horizontal settings-record-key'>
            <RecordKey project={project} />
          </Panel>
          <Panel header={`Node.js Version (${resolvedNodeVersion})`} key='node-version' className='form-horizontal settings-node'>
            <NodeVersion project={project} />
          </Panel>
          <Panel header='Proxy Settings' key='proxy-settings' className='form-horizontal settings-proxy'>
            <ProxySettings app={app} />
          </Panel>
          <Panel header='File Opener Preference' key='file-preference' className='form-horizontal settings-file-preference'>
            <FilePreference />
          </Panel>
          {hasExperiments &&
            <Panel header='Experiments' key='experiments' className='form-horizontal settings-experiments'>
              <Experiments project={project} />
            </Panel>
          }
        </Collapse>
      </div>
    </div>
  )
})

export default Settings
