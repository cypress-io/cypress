import { FocusScope } from '@react-aria/focus'
import React, {
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeTree, FixedSizeNodePublicState, VariableSizeNodePublicState, VariableSizeTree } from 'react-vtree'
import type { NodeComponentProps } from 'react-vtree/dist/lib/Tree'

import { useCombinedRefs } from '../../hooks/useCombinedRefs'
import { FocusStateContext, useFocusDispatch } from './focusState'

import {
  isParent,
  LeafTreeBase,
  ParentTreeBase,
  TreeNode,
  TreeNodeData,
  VirtualizedTreeProps,
} from './types'
import { TreeChild } from './VirtualizedTreeChild'

const VirtualizedTreeContents = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    treeRef,
    tree,
    isVariableSize,
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

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const internalRef = useRef<VariableSizeTree<TNodeData> | FixedSizeTree<TNodeData> | null>(null)

  const [focusStateRef] = useFocusDispatch()
  const deferredFocus = useRef<string | undefined>()

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

  const onChildUnmountFocusLoss = useCallback(() => {
    console.log('Focusing virtualized tree')
    wrapperRef.current?.focus()
  }, [])

  const onWrapperKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    console.log(`Wrapper ${event.key}`, event)

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        break
      default:
        return
    }

    const id = focusStateRef.current

    if (!id) {
      // TODO: Focus first item
      return
    }

    deferredFocus.current = id
    internalRef.current?.scrollToItem(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const treeRow = useCallback((props: NodeComponentProps<TNodeData, FixedSizeNodePublicState<TNodeData> | VariableSizeNodePublicState<TNodeData>>) => {
    return (
      <TreeChild
        {...props}
        indentSize={indentSize}
        showRoot={showRoot}
        shouldMeasure={shouldMeasure}
        onChildUnmountFocusLoss={onChildUnmountFocusLoss}
        onNodeKeyDown={onNodeKeyDown}
        onNodePress={onNodePress}
        onRenderLeaf={onRenderLeaf}
        onRenderParent={onRenderParent}
      />
    )
  }, [showRoot, indentSize, shouldMeasure, onNodePress, onNodeKeyDown, onRenderLeaf, onRenderParent, onChildUnmountFocusLoss])

  const sizer = useCallback(({ width, height }) => {
    const treeProps = {
      ...props,
      ref: internalRef,
      treeWalker,
      width,
      height,
      overscanCount,
    }

    return (
      <FocusScope>
        <div ref={wrapperRef} tabIndex={-1} onKeyDown={onWrapperKeyDown}>
          {isVariableSize ? (
            <VariableSizeTree<TNodeData> {...treeProps} ref={treeProps.ref as RefObject<VariableSizeTree<TNodeData>>}>
              {treeRow}
            </VariableSizeTree>
          ) : (
            <FixedSizeTree<TNodeData> {...treeProps} ref={treeProps.ref as RefObject<FixedSizeTree<TNodeData>>} itemSize={defaultItemSize}>
              {treeRow}
            </FixedSizeTree>
          )}
        </div>
      </FocusScope>
    )
  }, [defaultItemSize, isVariableSize, overscanCount, props, treeRow, treeWalker, onWrapperKeyDown])

  useEffect(() => {
    internalRef.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    })
  }, [tree])

  return (
    <AutoSizer>
      {sizer}
    </AutoSizer>
  )
}

export const VirtualizedTree = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>(props: VirtualizedTreeProps<TLeaf, TParent>) => (
    <FocusStateContext>
      <VirtualizedTreeContents {...props} />
    </FocusStateContext>
  )
