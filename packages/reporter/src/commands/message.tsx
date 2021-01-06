import _ from 'lodash'
import React from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import appState from '../lib/app-state'
import CommandModel from './command-model'
import { ObjectViewer } from './object-viewer'

const md = new Markdown()
const formattedMessage = (message: string) => message ? md.renderInline(message) : ''

interface MessageProps {
  model: CommandModel
}

export const Message = observer(({ model }: MessageProps) => (
  <span>
    <i className={`fas fa-circle ${model.renderProps.indicator}`} />
    <span
      className='command-message-text'
      dangerouslySetInnerHTML={{ __html: formattedMessage(model.displayMessage || '') }}
    />
    { model.options && Object.keys(model.options).length > 0
      ?
      <span className="command-message-options">
        <ObjectViewer obj={model.options} isOpen={!appState.isInteractive} />
      </span>
      : null
    }
  </span>
))
