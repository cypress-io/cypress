import { observer } from 'mobx-react'
import React, { createRef } from 'react'
import Loader from 'react-loader'

import updateStore from './update-store'
import ipc from '../lib/ipc'
import { useLifecycle } from '../lib/use-lifecycle'

export const LoadingReleaseNotes = () => (
  <div className='loading-release-notes'>
    <section>
      <Loader color='#888' scale={0.7} />
    </section>
  </div>
)

export const ReleaseNotes = observer(({ onShowInstructions }) => {
  const contentsRef = createRef()
  const notes = updateStore.releaseNotes

  useLifecycle({
    onMount () {
      const shadowRoot = contentsRef.current.attachShadow({ mode: 'open' })
      const wrapper = document.createElement('div')
      const styles = `
        <style>
          * {
            font-family: sans-serif;
          }
          a:link, a:visited {
            color: #3284d4;
            text-decoration: none;
          }
          a:hover, a:active {
            color: #3284d4;
            text-decoration: underline;
          }
          ul, ol {
            padding-left: 1em;
          }
          ol ol {
            list-style: lower-alpha;
          }
          blockquote {
            border-left: solid 3px #ddd;
            margin-left: 0;
            padding-left: 1em;
          }
          pre,
          code {
            background: #eee;
            border: solid 1px #ddd;
            font-family: monospace;
            padding: 2px 3px;
          }
          pre {
            padding: 0.8em 1.2em;
          }
        </style>
      `

      // intercept any links, so we can open them externally
      wrapper.onclick = (e) => {
        e.stopPropagation()
        e.preventDefault()

        const href = e.target && e.target.getAttribute('href')

        if (href) {
          ipc.externalOpen(href)
        }
      }

      wrapper.innerHTML = `${styles}${notes.content}`
      shadowRoot.appendChild(wrapper)
    },
  })

  const openExternalLink = () => {
    ipc.externalOpen(notes.externalLink)
  }

  return (
    <div className='release-notes'>
      <header>
        <h4>{notes.title}</h4>
      </header>
      {notes.bannerImage && <img width="548" src={notes.bannerImage} />}
      <section className='contents' ref={contentsRef}></section>
      <section className='update-cta'>
        <button onClick={onShowInstructions}>Update Now</button>
      </section>
      {notes.externalLink && notes.externalLinkText && (
        <section className='external-link'>
          <button onClick={openExternalLink}>{notes.externalLinkText}</button>
        </section>
      )}
    </div>
  )
})
