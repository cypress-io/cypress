import { observer } from 'mobx-react'
import Markdown from 'markdown-it'
import React from 'react'

import QuestionMarkIcon from '@packages/frontend-shared/src/assets/icons/action-question-mark-outline_x16.svg'
import WarningIcon from '@packages/frontend-shared/src/assets/icons/warning_x16.svg'

const md = new Markdown({ html: true })

export interface RunnablesErrorModel {
  title: string
  link?: string | null
  callout?: string | null
  message: string
}

interface RunnablesErrorProps {
  error: RunnablesErrorModel
}

export const RunnablesError = observer(({ error }: RunnablesErrorProps) => (
  <div className='error'>
    <h2>
      <WarningIcon /> {error.title}
      {error.link &&
        <a href={error.link} target='_blank' rel='noopener noreferrer'>
          <QuestionMarkIcon />
        </a>
      }
    </h2>
    {error.callout && <pre>{error.callout}</pre>}
    <div className='error-message' dangerouslySetInnerHTML={{ __html: md.render(error.message) }} />
  </div>
))
