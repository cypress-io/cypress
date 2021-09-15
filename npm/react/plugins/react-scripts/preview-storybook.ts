import { composeStories } from '@storybook/testing-react'

interface SpecImport {
  shouldLoad: () => boolean
  load: () => Promise<any>
  chunkName: string
  file: Cypress.Cypress['spec']
}

export function shouldPreview () {
  return (
    new URLSearchParams(document.location.search).get('type') === 'preview'
  )
}

export async function init (
  importPromises: { [filename: string]: SpecImport },
  supportPromise: () => Promise<void>,
) {
  (window as any).__CYPRESS__IS__PREVIEW = true
  const previewLoaders = Object.values(importPromises).filter(
    ({ file }) => (file.specType as string) === 'component-preview',
  )

  for (const preview of previewLoaders) {
    const originalLoad = preview.load

    preview.load = () => {
      return originalLoad().then((storyModule) => {
        return composeStoriesFromModule(storyModule, preview)
      })
    }
  }

  const scriptLoaders = Object.values(importPromises).reduce(
    (accSpecLoaders, specLoader) => {
      if (specLoader.shouldLoad()) {
        accSpecLoaders.push(specLoader.load)
      }

      return accSpecLoaders
    },
    [supportPromise],
  )

  polyfillMochaGlobals()

  for (const script of scriptLoaders) {
    await script()
  }
}

function composeStoriesFromModule (storyModule: any, preview: SpecImport) {
  const composed = composeStories(storyModule)
  const specText = generateSpecFromStories(storyModule, composed)
  const specName = preview.file.absolute.replace('stories.tsx', 'spec.tsx');

  // parent
  // .fetch('/__/createSpecFromStory', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ spec: specText, absolute: specName }),
  // })
  // .then((res) => {
  //   window.location.href = `/__cypress/iframes/${specName}?type=preview`
  // })
  (parent as any).__CYPRESS_APP_BUS.getStorySource(specText, specName)
}

function generateSpecFromStories (
  storyModule: any,
  composed: ReturnType<typeof composeStories>,
) {
  const fileName = document.location.pathname.split('/').pop() as string
  const fileWithoutExtension = fileName.split('.').slice(0, -1).join('.')

  return `import React from 'react';
import * as stories from './${fileWithoutExtension}';
import { composeStories } from '@storybook/testing-react';
import { mount } from '@cypress/react';

const composedStories = composeStories(stories);

describe('${storyModule.default.title}', () => {
${Object.keys(composed)
  .map((variant, i) => {
    return `  ${i !== 0 ? '// ' : ''}it('should render ${variant}', () => {
  ${i !== 0 ? '// ' : ''}  const { ${variant} } = composedStories
  ${i !== 0 ? '// ' : ''}  mount(<${variant} />)
  ${i !== 0 ? '// ' : ''}})`
  })
  .join('\n\n')}
})`
}

function polyfillMochaGlobals () {
  (window as any).Cypress = {
    Commands: { overwrite: () => {} },
    on: () => {},
  } as any

  window.describe = ((command: string, fn: Function) => fn()) as any
  window.it = ((command: string, fn: Function) => fn()) as any
}
