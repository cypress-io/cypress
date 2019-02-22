import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'
import Collapse, { Panel } from 'rc-collapse'

import Configuration from './configuration'
import ProjectId from './project-id'
import RecordKey from './record-key'
import ProxySettings from './proxy-settings'

const Settings = observer(({ project, app }) => (
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
        <Panel header='Proxy Settings' key='proxy-settings' className='form-horizontal proxy-settings'>
          <ProxySettings app={app} />
        </Panel>
      </Collapse>
    </div>
  </div>
))

export default Settings
