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
import { FocusStateContext, useFocusDispatch } from './focusState'

import {
  createPressEventNode,
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

  const [focusIdRef, dispatch] = useFocusDispatch()

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

  const onKeyDown = useMemo(() => {
    const currentSelectionIndex = () => {
      const order = internalRef.current?.state.order

      if (order === undefined) {
        return -1
      }

      if (order !== undefined) {
        return focusIdRef.current ? order.indexOf(focusIdRef.current) ?? -1 : -1
      }
    }

    const currentNode = () => {
      const order = internalRef.current?.state.order

      const currentIndex = currentSelectionIndex()

      if (order === undefined || currentIndex === undefined || currentIndex === -1) {
        return undefined
      }

      return internalRef.current?.state.records.get(order[currentIndex])?.public
    }

    return (event: React.KeyboardEvent<HTMLDivElement>) => {
      const order = internalRef.current?.state.order

      if (!order) {
        return
      }

      const node = currentNode()

      if (node) {
        const { data, isOpen, setOpen } = node

        onNodeKeyDown?.(createPressEventNode(data as TreeNodeData<TLeaf, TParent>, isOpen, setOpen), event)

        if (event.defaultPrevented) {
          return
        }
      }

      switch (event.key) {
        case 'ArrowDown': {
          const currentIndex = currentSelectionIndex()

          if (currentIndex === undefined) {
            break
          }

          const newSelectionIndex = currentIndex + 1

          if (newSelectionIndex >= order.length) {
            break
          }

          const newId = order[newSelectionIndex]

          dispatch(newId)
          internalRef.current?.scrollToItem(newId)
          break
        }
        case 'ArrowUp': {
          const currentIndex = currentSelectionIndex()

          if (currentIndex === undefined) {
            break
          }

          let newSelectionIndex = currentIndex - 1

          if (newSelectionIndex < 0) {
            newSelectionIndex = 0
          }

          const newId = order[newSelectionIndex]

          dispatch(newId)
          internalRef.current?.scrollToItem(newId)
          break
        }
        case 'ArrowRight': {
          if (!node) {
            break
          }

          const { data, isOpen, setOpen } = node

          if (isParent(data.node) && !isOpen) {
            setOpen(true)
          }

          break
        }
        case 'ArrowLeft': {
          if (!node) {
            break
          }

          const { data, isOpen, setOpen } = node

          if (isParent(data.node) && isOpen) {
            setOpen(false)
          }

          break
        }
        case 'Enter':
        case 'Spacebar':
        case ' ': {
          if (!node) {
            break
          }

          const { data, isOpen, setOpen } = node

          onNodePress?.(createPressEventNode(data as TreeNodeData<TLeaf, TParent>, isOpen, setOpen), {
            type: 'press',
            pointerType: 'keyboard',
            target: event.currentTarget,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            ctrlKey: event.ctrlKey,
          })

          break
        }
        default: {
          return
        }
      }

      event.preventDefault()
      event.stopPropagation()
    }
  }, [onNodePress, onNodeKeyDown, focusIdRef, dispatch])

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
      <div tabIndex={0} onKeyDown={onKeyDown}>
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
      </div>
    </FocusScope>
  ), [overscanCount, props, treeRow, treeWalker, onKeyDown])

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
