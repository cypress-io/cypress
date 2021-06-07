/* eslint-disable react/jsx-no-bind */
import React from 'react'
import { Button } from '../../core/button/Button'

import { createStory, createStorybookConfig } from '../../stories/util'

import { VirtualizedTree as VirtualizedTreeComponent } from './VirtualizedTree'

export default createStorybookConfig({
  title: 'Components/VirtualizedTree',
})

type TreeLeaf = {
  id: string
  name: string
}

type TreeParent = {
  id: string
  name: string
  children: Array<TreeLeaf | TreeParent>
}

const tree: TreeParent = {
  id: 'root',
  name: 'Root',
  children: [
    {
      id: 'child1',
      name: 'Child 1',
      children: [
        {
          id: 'child11',
          name: 'Child 11',
        },
        {
          id: 'child12',
          name: 'Child 12',
          children: [
            {
              id: 'child121',
              name: 'Child 121',
            },
          ],
        },
      ],
    },
    {
      id: 'child2',
      name: 'Child 2',
    },
    {
      id: 'child3',
      name: 'Child 3',
    },
    {
      id: 'child4',
      name: 'Child 4',
      children: [
        {
          id: 'child41',
          name: 'Child 41',
        },
      ],
    },
  ],
}

export const VirtualizedTree = createStory(() => {
  return (
    <div>
      <Button color="white" aria-label='Before focus'>Before focus</Button>
      <div style={{ width: 800, height: 400 }}>
        <VirtualizedTreeComponent<TreeLeaf, TreeParent>
          tree={tree}
          defaultItemSize={20}
          onNodePress={(node) => {
            if (node.type === 'parent') {
              node.setOpen(!node.isOpen)
            }
          }}
          onRenderParent={({ parent, depth, isOpen, setOpen }) => (
            <div style={{ marginLeft: 20 * depth, backgroundColor: 'red', cursor: 'pointer' }}>
              {parent.name}
            </div>
          )}
          onRenderLeaf={({ leaf, depth }) => (
            <div style={{ marginLeft: 20 * depth }}>
              {leaf.name}
            </div>
          )}
        />
      </div>
      <Button color="white" aria-label='After focus'>After focus</Button>
    </div>
  )
})
