import React, {
  memo,
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeTree } from 'react-vtree'
import { ListProps } from 'react-window'
import { useCombinedRefs } from '../../hooks/useCombinedRefs'

import { useCurrent } from '../../hooks/useCurrent'
import { CollapsibleGroupHeader } from '../collapsibleGroup/CollapsibleGroupHeader'

import {
  ChildComponentProps,
  isParent,
  LeafTreeBase,
  ParentTreeBase,
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
  }

interface RenderFunctions<TLeaf, TParent> {
  onRenderLeaf: (props: {
    leaf: TLeaf
    depth: number
    remeasure: () => void
  }) => JSX.Element
  onRenderParent?: (props: {
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
    onRenderLeaf,
    onRenderParent,
    ...props
  }: VirtualizedTreeProps<TLeaf, TParent>) => {
  const internalRef = useRef<VariableSizeTree<
    TreeNodeData<TLeaf, TParent>
  > | null>(null)

  useCombinedRefs(internalRef, treeRef ?? null)

  const buildNodeData = (node: TLeaf | TParent, nestingLevel: number): TreeNode<TLeaf, TParent> => ({
    data: {
      id: node.id,
      node,
      nestingLevel,
      isOpenByDefault: true,
      defaultHeight: defaultItemSize,
    },
  })

  function* treeWalker (): Generator<TreeNode<TLeaf, TParent> | undefined, undefined, TreeNode<TLeaf, TParent>> {
    if (showRoot) {
      yield buildNodeData(tree, 0)
    } else {
      // Push all children of root as many psuedo roots
      for (let i = 0; i < tree.children.length; i++) {
        yield buildNodeData(tree.children[i] as TLeaf | TParent, 0)
      }
    }

    while (true) {
      const parent = yield

      if (!isParent(parent.data.node)) {
        continue
      }

      for (const child of parent.data.node.children) {
        yield buildNodeData(child as TLeaf | TParent, parent.data.nestingLevel + 1)
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
        <VariableSizeTree<TreeNodeData<TLeaf, TParent>>
          {...props}
          ref={internalRef}
          treeWalker={treeWalker}
          width={width}
          height={height}
          overscanCount={overscanCount}
        >
          {(props) => {
            props.data

            return (
              <TreeChild
                {...props}
                indentSize={indentSize}
                showRoot={showRoot}
                onRenderLeaf={onRenderLeaf}
                onRenderParent={onRenderParent}
              />
            )
          }}
        </VariableSizeTree>
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

  const id = data.node.id

  const remeasure = useCallback(() => setMeasuring(true), [])

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
        style={indentSize ? { marginLeft: `${data.nestingLevel * indentSize}rem` } : {}}
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
      ? onRenderParent?.({
        parent: node,
        depth: nestingLevel,
        isOpen,
        setOpen,
        remeasure,
      }) ?? (
        <CollapsibleGroupHeader
          title={node.id}
          expanded={isOpen}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => setOpen(!isOpen)}
        />
      )
      : onRenderLeaf({
        leaf: node,
        depth: nestingLevel,
        remeasure,
      })

// Memo `onRender` callback results to double the speed of height calculation
const MemoedOnRenderChild = memo(OnRenderChild) as typeof OnRenderChild
