import { observer } from 'mobx-react'
import Markdown from 'markdown-it'
import React from 'react'

const md = new Markdown({ html: true })

export interface Error {
  title: string
  link?: string | null
  callout?: string | null
  message: string
}

export interface AnErrorProps {
  error: Error
}

const AnError = observer(({ error }: AnErrorProps) => (
  <div className='error'>
    <h2>
      <i className='fa fa-warning'></i> {error.title}
      {error.link &&
        <a href={error.link} target='_blank' rel='noopener noreferrer'>
          <i className='fa fa-question-circle'></i>
        </a>
      }
    </h2>
    {error.callout && <pre>{error.callout}</pre>}
    <div className='error-message' dangerouslySetInnerHTML={{ __html: md.render(error.message) }} />
  </div>
))

export default AnError
