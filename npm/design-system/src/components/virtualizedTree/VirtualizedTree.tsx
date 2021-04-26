import { FocusScope } from '@react-aria/focus'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeNodePublicState, VariableSizeTree } from 'react-vtree'
import type { NodeComponentProps } from 'react-vtree/dist/lib/Tree'

import { useCombinedRefs } from '../../hooks/useCombinedRefs'

import {
  isParent,
  LeafTreeBase,
  ParentTreeBase,
  TreeNode,
  TreeNodeData,
  VirtualizedTreeProps,
} from './types'
import { TreeChild } from './VirtualizedTreeChild'

export const VirtualizedTree = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    treeRef,
    tree,
    defaultItemSize,
    overscanCount = 20,
    indentSize,
    showRoot,
    shouldMeasure,
    onNodePress,
    onNodeKeyDown,
    onRenderLeaf,
    onRenderParent,
    ...props
  }: VirtualizedTreeProps<TLeaf, TParent>) => {
  type TNodeData = TreeNodeData<TLeaf, TParent>

  const internalRef = useRef<VariableSizeTree<TNodeData> | null>(null)

  useCombinedRefs(internalRef, treeRef ?? null)

  const treeWalker = useMemo(() => {
    const buildNodeData = (node: TLeaf | TParent, nestingLevel: number, isFirst: boolean): TreeNode<TLeaf, TParent> => ({
      data: {
        id: node.id,
        node,
        nestingLevel,
        isOpenByDefault: true,
        defaultHeight: defaultItemSize,
        isFirst,
      },
    })

    function* walker (): Generator<TreeNode<TLeaf, TParent> | undefined, undefined, TreeNode<TLeaf, TParent>> {
      if (showRoot) {
        yield buildNodeData(tree, 0, true)
      } else {
        // Push all children of root as many psuedo roots
        for (let i = 0; i < tree.children.length; i++) {
          yield buildNodeData(tree.children[i] as TLeaf | TParent, 0, i === 0)
        }
      }

      while (true) {
        const parent = yield

        if (!isParent(parent.data.node)) {
          continue
        }

        for (const child of parent.data.node.children) {
          yield buildNodeData(child as TLeaf | TParent, parent.data.nestingLevel + 1, false)
        }
      }
    }

    return walker
  }, [tree, showRoot, defaultItemSize])

  useEffect(() => {
    internalRef.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    })
  }, [tree])

  const treeRow = useCallback((props: NodeComponentProps<TNodeData, VariableSizeNodePublicState<TNodeData>>) => {
    return (
      <TreeChild
        {...props}
        indentSize={indentSize}
        showRoot={showRoot}
        shouldMeasure={shouldMeasure}
        onNodeKeyDown={onNodeKeyDown}
        onNodePress={onNodePress}
        onRenderLeaf={onRenderLeaf}
        onRenderParent={onRenderParent}
      />
    )
  }, [showRoot, indentSize, shouldMeasure, onNodePress, onNodeKeyDown, onRenderLeaf, onRenderParent])

  const sizer = useCallback(({ width, height }) => (
    <FocusScope>
      <VariableSizeTree<TNodeData>
        {...props}
        ref={internalRef}
        treeWalker={treeWalker}
        width={width}
        height={height}
        overscanCount={overscanCount}
      >
        {treeRow}
      </VariableSizeTree>
    </FocusScope>
  ), [overscanCount, props, treeRow, treeWalker])

  return (
    <AutoSizer>
      {sizer}
    </AutoSizer>
  )
}
