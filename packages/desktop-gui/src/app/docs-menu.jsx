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
    if (!project || !project.prompts.anyOpen) {
      setOpen(true)
    }
  }

  const _closeMenu = () => setOpen(false)

  const _openDocs = (e) => {
    e.preventDefault()
    ipc.externalOpen({
      url: 'https://on.cypress.io/docs',
      params: {
        utm_medium: 'Nav',
        utm_campaign: 'Docs',
      },
    })
  }

  const _handleMenuClick = (e, item) => {
    e.preventDefault()

    if (item.action) {
      _closeMenu()
      item.action()
    }

    if (item.link) {
      ipc.externalOpen(item.link)
    }
  }

  const _menuContent = () => {
    // revert to a link in global mode
    const showPromptOrLink = (promptSlug, link) => {
      if (project && project.prompts) {
        return { action: _.partial(project.prompts.openPrompt, promptSlug) }
      }

      return { link }
    }

    const utm_medium = 'Docs Menu'

    return [{
      title: 'Get started',
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
      title: 'Do more in CI',
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
        text: 'Running tests faster',
        ...showPromptOrLink('orchestration1', {
          url: 'https://on.cypress.io/parallelization',
          params: {
            utm_medium,
            utm_content: 'Parallelization',
          },
        }),
      }],
    }]
  }

  const active = open || (project && project.prompts.anyOpen)

  return (
    <>
      <li className={cs('docs-menu', { active })} onMouseEnter={_openMenu} onMouseLeave={_closeMenu}>
        <a onClick={_openDocs} ref={setReferenceElement}>
          <i className='fas fa-graduation-cap' /> Docs
        </a>
        {open && (
          <div className='popper docs-dropdown' ref={setPopperElement} style={popperStyles.popper} {...popperAttributes.popper}>
            {_.map(_menuContent(), ({ title, children, itemIcon }) => (
              <ul className='dropdown-column' key={title}>
                <li className='column-title'>{title}</li>
                {_.map(children, (item) => (
                  <li className='column-item' key={item.text}>
                    <a onClick={(e) => _handleMenuClick(e, item)}>
                      <i className={itemIcon || item.icon || 'far fa-file-alt'} />
                      <span>{item.text}</span>
                      { item.link && <i className='fas fa-long-arrow-alt-right' /> }
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
