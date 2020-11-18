import { observer } from 'mobx-react'
import Markdown from 'markdown-it'
import React from 'react'

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
      <i className='fas fa-exclamation-triangle' /> {error.title}
      {error.link &&
        <a href={error.link} target='_blank' rel='noopener noreferrer'>
          <i className='fas fa-question-circle' />
        </a>
      }
    </h2>
    {error.callout && <pre>{error.callout}</pre>}
    <div className='error-message' dangerouslySetInnerHTML={{ __html: md.render(error.message) }} />
  </div>
))
