/* eslint-disable react/jsx-no-bind */
import React from 'react'
import { Button } from '../../core/button/Button'

import { createStory, createStorybookConfig } from '../../stories/util'

import { FileTree as FileTreeComponent } from './FileTree'

export default createStorybookConfig({
  title: 'Components/FileTree',
})

const paths = [
  '/cypress/integration/spec1.tsx',
  '/cypress/integration/spec2.tsx',
  '/cypress/integration/feature1/spec3.tsx',
  '/cypress/integration/feature1/spec4.tsx',
  '/cypress/integration/feature1/sub/spec6.tsx',
  '/rootspec.tsx',
  '/cypress/whyisthishere.spec.js',
  '/src/core/foo.spec.js',
].map((path) => ({ path }))

export const FileTree = createStory(() => {
  return (
    <div>
      <Button color="white" aria-label='Before focus'>Before focus</Button>
      <div style={{ width: 800, height: 400 }}>
        <FileTreeComponent<{path: string}>
          files={paths}
          rootDirectory="/"
        />
      </div>
      <Button color="white" aria-label='After focus'>After focus</Button>
    </div>
  )
})
