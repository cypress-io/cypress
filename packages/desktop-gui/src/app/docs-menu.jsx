import React, { useState } from 'react'
import { observer } from 'mobx-react'
import _ from 'lodash'
import { usePopper } from 'react-popper'
import cs from 'classnames'

import viewStore from '../lib/view-store'
import ipc from '../lib/ipc'
import Prompts from '../prompts/prompts'

// docs menu must be a functional component to use popper
const DocsMenu = observer(() => {
  const { project } = viewStore.currentView

  // popper intentionally needs useState for refs rather than useRef
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const [arrowElement, setArrowElement] = useState(null)
  const [open, setOpen] = useState(false)

  const { styles: popperStyles, attributes: popperAttributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom',
    strategy: 'fixed',
    modifiers: [{
      name: 'arrow',
      options: {
        element: arrowElement,
      },
    }, {
      name: 'offset',
      options: {
        offset: [window.innerWidth > 550 ? -175 : 0, 0],
      },
    }],
  })

  const _openMenu = () => {
    if (!project.prompts.anyOpen) {
      setOpen(true)
    }
  }
  const _closeMenu = () => setOpen(false)

  const _handleDocsClick = (e, item) => {
    e.preventDefault()

    if (item.action) {
      item.action()
    }

    if (item.link) {
      ipc.externalOpen(item.link)
    }
  }

  const _docsMenuContent = () => {
    // revert to a link in global mode
    const showPromptOrLink = (promptSlug, link) => {
      if (project && project.prompts) {
        return { action: _.partial(project.prompts.openPrompt, promptSlug) }
      }

      return { link }
    }

    const utm_medium = 'Docs Menu'

    return [{
      title: 'Get Started',
      children: [{
        text: 'Write your first test',
        link: {
          url: 'https://on.cypress.io/writing-first-test',
          params: {
            utm_medium,
            utm_content: 'First Test',
          },
        },
      }, {
        text: 'Testing your app',
        link: {
          url: 'https://on.cypress.io/testing-your-app',
          params: {
            utm_medium,
            utm_content: 'Testing Your App',
          },
        },
      }],
    }, {
      title: 'References',
      children: [{
        text: 'Best practices',
        link: {
          url: 'https://on.cypress.io/best-practices',
          params: {
            utm_medium,
            utm_content: 'Best Practices',
          },
        },
      }, {
        text: 'Configuration',
        link: {
          url: 'https://on.cypress.io/configuration',
          params: {
            utm_medium,
            utm_content: 'Configuration',
          },
        },
      }, {
        text: 'API',
        link: {
          url: 'https://on.cypress.io/api',
          params: {
            utm_medium,
            utm_content: 'API',
          },
        },
      }],
    }, {
      title: 'Optimize Cypress in CI',
      itemIcon: 'far fa-lightbulb',
      children: [{
        text: 'Setting up CI',
        ...showPromptOrLink('ci1', {
          url: 'https://on.cypress.io/ci',
          params: {
            utm_medium,
            utm_content: 'Set Up CI',
          },
        }),
      }, {
        text: 'Debugging failed tests',
        ...showPromptOrLink('dashboard1', {
          url: 'https://on.cypress.io/features-dashboard',
          params: {
            utm_medium,
            utm_content: 'Debugging',
          },
        }),
      }, {
        text: 'Running tests faster',
        link: 'https://on.cypress.io',
      }],
    }]
  }

  return (
    <>
      <li className={cs('docs-menu', { active: open || project.prompts.anyOpen })} onMouseEnter={_openMenu} onMouseLeave={_closeMenu}>
        <a ref={setReferenceElement}>
          <i className='fas fa-graduation-cap' /> Docs
        </a>
        {open && (
          <div className='popper docs-dropdown' ref={setPopperElement} style={popperStyles.popper} {...popperAttributes.popper}>
            {_.map(_docsMenuContent(), ({ title, children, itemIcon }) => (
              <ul className='dropdown-column' key={title}>
                <li className='column-title'>{title}</li>
                {_.map(children, (item) => (
                  <li className='column-item' key={item.text}>
                    <a onClick={(e) => _handleDocsClick(e, item)}>
                      <i className={itemIcon || item.icon || 'far fa-file-alt'} />
                      <span>{item.text}</span>
                      <i className='fas fa-long-arrow-alt-right' />
                    </a>
                  </li>
                ))}
              </ul>
            ))}
            <div className='arrow' ref={setArrowElement} style={popperStyles.arrow} />
          </div>
        )}
      </li>
      <Prompts project={project} referenceElement={referenceElement} />
    </>
  )
})

export default DocsMenu
