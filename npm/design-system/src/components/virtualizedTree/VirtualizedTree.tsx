import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeNodePublicState, VariableSizeTree } from 'react-vtree'
import type { NodeComponentProps } from 'react-vtree/dist/lib/Tree'

import { useCombinedRefs } from 'hooks/useCombinedRefs'
import { FocusStateContext, FocusStateHasFocusContext, useFocusDispatch } from './focusState'
import {
  createPressEventNode,
  isParent,
  LeafTreeBase,
  OnNodePress,
  ParentTreeBase,
  TreeNode,
  TreeNodeData,
  VirtualizedTreeProps,
} from './types'
import { TreeChild } from './VirtualizedTreeChild'

import styles from './VirtualizedTree.module.scss'

const VirtualizedTreeContents = <TLeaf extends LeafTreeBase, TParent extends ParentTreeBase<TLeaf>>({
  innerRef,
  treeRef,
  tree,
  defaultItemSize,
  overscanCount = 20,
  indentSize,
  showRoot,
  shouldMeasure,
  onNodePress: externalOnNodePress,
  onNodeKeyDown,
  onRenderLeaf,
  onRenderParent,
  ...props
}: VirtualizedTreeProps<TLeaf, TParent>) => {
  type TNodeData = TreeNodeData<TLeaf, TParent>

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const internalRef = useRef<VariableSizeTree<TNodeData> | null>(null)

  useCombinedRefs(internalRef, treeRef ?? null)

  const [focusIdRef, dispatch] = useFocusDispatch()
  const [hasFocus, setHasFocus] = useState(false)

  useImperativeHandle(innerRef, () => ({
    focus: () => wrapperRef.current?.focus(),
  }))

  const treeWalker = useMemo(() => {
    const buildNodeData = (
      node: TLeaf | TParent,
      nestingLevel: number,
      isFirst: boolean
    ): TreeNode<TLeaf, TParent> => ({
      data: {
        id: node.id,
        node,
        nestingLevel,
        isOpenByDefault: true,
        defaultHeight: defaultItemSize,
        isFirst,
      },
    })

    function* walker(): Generator<TreeNode<TLeaf, TParent> | undefined, undefined, TreeNode<TLeaf, TParent>> {
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

  const currentSelectionIndex = useCallback(() => {
    const order = internalRef.current?.state.order

    if (order === undefined) {
      return -1
    }

    if (order !== undefined) {
      return focusIdRef.current ? order.indexOf(focusIdRef.current) ?? -1 : -1
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onNodePress = useCallback<OnNodePress<TLeaf, TParent>>(
    (node, event) => {
      dispatch(node.data.id)

      externalOnNodePress?.(node, event)
      wrapperRef.current?.focus()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [externalOnNodePress]
  )

  const onKeyDown = useMemo(() => {
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

      let id = node?.data.id

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

          id = order[newSelectionIndex]

          dispatch(id)
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

          id = order[newSelectionIndex]

          dispatch(id)
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

      if (id) {
        // Make sure the node that was pressed is in view
        internalRef.current?.scrollToItem(id)
      }

      event.preventDefault()
      event.stopPropagation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNodePress, onNodeKeyDown])

  const onFocus = useCallback(() => {
    setHasFocus(true)

    const state = internalRef.current?.state

    const currentIndex = currentSelectionIndex()

    if (currentIndex === -1 && state && (state.order?.length ?? 0) > 0) {
      // No selected row
      dispatch(state.order![0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const onBlur = useCallback(() => setHasFocus(false), [])

  useEffect(() => {
    // Clear selected node
    dispatch(undefined)

    internalRef.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree])

  const treeRow = useCallback(
    (props: NodeComponentProps<TNodeData, VariableSizeNodePublicState<TNodeData>>) => {
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
    },
    [showRoot, indentSize, shouldMeasure, onNodePress, onNodeKeyDown, onRenderLeaf, onRenderParent]
  )

  const sizer = useCallback(
    ({ width, height }) => (
      <div
        ref={wrapperRef}
        className={styles.focusWrapper}
        tabIndex={0}
        data-cy="virtualized-tree"
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      >
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
    ),
    [overscanCount, props, treeRow, treeWalker, onKeyDown, onFocus, onBlur]
  )

  // TODO: Figure out the proper accessibility wrappers
  return (
    <FocusStateHasFocusContext.Provider value={hasFocus}>
      <AutoSizer>{sizer}</AutoSizer>
    </FocusStateHasFocusContext.Provider>
  )
}

export const VirtualizedTree = <TLeaf extends LeafTreeBase, TParent extends ParentTreeBase<TLeaf>>(
  props: VirtualizedTreeProps<TLeaf, TParent>
) => (
  <FocusStateContext>
    <VirtualizedTreeContents {...props} />
  </FocusStateContext>
)
