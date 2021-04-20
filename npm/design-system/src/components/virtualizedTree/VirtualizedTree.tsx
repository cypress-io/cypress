import { FocusScope, useFocusManager } from '@react-aria/focus'
import { usePress } from '@react-aria/interactions'
import { PressEvent } from '@react-types/shared'
import React, {
  memo,
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeTree } from 'react-vtree'
import { ListProps } from 'react-window'

import { useCombinedRefs } from '../../hooks/useCombinedRefs'
import { useCurrent } from '../../hooks/useCurrent'

import {
  ChildComponentProps,
  isParent,
  LeafTreeBase,
  OnNodePress,
  ParentTreeBase,
  SpecificTreeNode,
  TreeNode,
  TreeNodeData,
} from './types'

export type VirtualizedTreeProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = RenderFunctions<TLeaf, TParent> &
  Omit<ListProps, 'children' | 'itemCount' | 'width' | 'height'> & {
    treeRef?: MutableRefObject<VariableSizeTree<
      TreeNodeData<TLeaf, TParent>
    > | null>
    tree: TParent

    defaultItemSize: number
    showRoot?: boolean
    /**
     * See `react-window` `overscanCount`. Defaults to 20
     */
    overscanCount?: number

    /**
     * If specified, automatically indent children elements by the specified size in REM units
     */
    indentSize?: number

    onNodePress?: OnNodePress<TLeaf, TParent>
  }

interface RenderFunctions<TLeaf, TParent> {
  onRenderLeaf: (props: {
    leaf: TLeaf
    depth: number
    remeasure: () => void
  }) => JSX.Element
  onRenderParent: (props: {
    parent: TParent
    depth: number
    isOpen: boolean
    setOpen: (isOpen: boolean) => void
    remeasure: () => void
  }) => JSX.Element | null
}

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
    onNodePress,
    onRenderLeaf,
    onRenderParent,
    ...props
  }: VirtualizedTreeProps<TLeaf, TParent>) => {
  const internalRef = useRef<VariableSizeTree<
    TreeNodeData<TLeaf, TParent>
  > | null>(null)

  useCombinedRefs(internalRef, treeRef ?? null)

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

  function* treeWalker (): Generator<TreeNode<TLeaf, TParent> | undefined, undefined, TreeNode<TLeaf, TParent>> {
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

  useEffect(() => {
    internalRef.current?.recomputeTree({
      refreshNodes: true,
      useDefaultHeight: true,
    })
  }, [tree])

  return (
    <AutoSizer>
      {({ width, height }) => (
        <FocusScope>
          <VariableSizeTree<TreeNodeData<TLeaf, TParent>>
            {...props}
            ref={internalRef}
            treeWalker={treeWalker}
            width={width}
            height={height}
            overscanCount={overscanCount}
          >
            {(props) => (
              <TreeChild
                {...props}
                indentSize={indentSize}
                showRoot={showRoot}
                onNodePress={onNodePress}
                onRenderLeaf={onRenderLeaf}
                onRenderParent={onRenderParent}
              />
            )}
          </VariableSizeTree>
        </FocusScope>
      )}
    </AutoSizer>
  )
}

const TreeChild = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    data,
    isOpen,
    style,
    height,
    indentSize,
    showRoot,
    onNodePress,
    setOpen,
    resize,
    onRenderLeaf,
    onRenderParent,
  }: ChildComponentProps<TLeaf, TParent> &
  RenderFunctions<TLeaf, TParent> & {
    indentSize?: number
    showRoot?: boolean
  }) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [measuring, setMeasuring] = useState(false)

  const currentRef = useCurrent(ref)
  const currentMeasuring = useCurrent(measuring)

  const focusManager = useFocusManager()

  const id = data.node.id

  const onPress = useMemo(() => onNodePress ? {
    onPress: (event: PressEvent) => {
      const typedData = isParent(data.node) ? {
        type: 'parent' as const,
        data: data as SpecificTreeNode<TParent>,
        isOpen,
        setOpen,
        ref: currentRef,
      } : {
        type: 'leaf' as const,
        data: data as SpecificTreeNode<TLeaf>,
        isOpen,
        setOpen,
        ref: currentRef,
      }

      onNodePress(typedData, event)
    },
  } : {}, [data, isOpen, setOpen, onNodePress, currentRef])

  const { pressProps } = usePress(onPress)
  const pressOnKeyDown = pressProps.onKeyDown

  const remeasure = useCallback(() => setMeasuring(true), [])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        focusManager.focusNext()
        break
      case 'ArrowUp':
        focusManager.focusPrevious()
        break
      default:
        pressOnKeyDown?.(event)

        return
    }

    event.preventDefault()
  }, [focusManager, pressOnKeyDown])

  useLayoutEffect(() => {
    // On a new render (prop update), mark the component as ready to measure
    if (currentMeasuring.current) {
      return
    }

    setMeasuring(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, style, isOpen])

  useLayoutEffect(() => {
    // When we are measuring, measure the current DOM and update if necessary
    if (!measuring || !currentRef.current) {
      return
    }

    const measuredHeight = currentRef.current.getBoundingClientRect().height

    if (measuredHeight !== height) {
      resize(measuredHeight, true)
    }

    setMeasuring(false)
  }, [measuring, height, id, resize, currentRef])

  return id !== 'root' || showRoot ? (
    <span style={style}>
      <div
        ref={setRef}
        {...pressProps}
        style={indentSize ? { marginLeft: `${data.nestingLevel * indentSize}rem` } : {}}
        // First item is assigned a tabindex to allow tabbing in and out of the tree
        tabIndex={data.isFirst ? 0 : -1}
        onKeyDown={onKeyDown}
      >
        <MemoedOnRenderChild
          data={data}
          isOpen={isOpen}
          setOpen={setOpen}
          remeasure={remeasure}
          onRenderLeaf={onRenderLeaf}
          onRenderParent={onRenderParent}
        />
      </div>
    </span>
  ) : null
}

type OnRenderChildProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = Pick<
  ChildComponentProps<TLeaf, TParent>,
  'data' | 'isOpen' | 'setOpen'
> &
  RenderFunctions<TLeaf, TParent> & {
    remeasure: () => void
  }

const OnRenderChild = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>({
    data: { node, nestingLevel },
    isOpen,
    setOpen,
    remeasure,
    onRenderLeaf,
    onRenderParent,
  }: OnRenderChildProps<TLeaf, TParent>) =>
    isParent(node)
      ? onRenderParent({
        parent: node,
        depth: nestingLevel,
        isOpen,
        setOpen,
        remeasure,
      })
      : onRenderLeaf({
        leaf: node,
        depth: nestingLevel,
        remeasure,
      })

// Memo `onRender` callback results to double the speed of height calculation
const MemoedOnRenderChild = memo(OnRenderChild) as typeof OnRenderChild
