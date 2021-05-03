import type { PressEvent } from '@react-types/shared'
import type { MutableRefObject } from 'react'
import type { NodeComponentProps } from 'react-vtree/dist/lib/Tree'
import type { VariableSizeNodePublicState } from 'react-vtree/dist/lib/VariableSizeTree'
import type { VariableSizeTree } from 'react-vtree'
import type { ListProps } from 'react-window'

// Props

export interface VirtualizedTreeProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> extends RenderFunctions<TLeaf, TParent>, Omit<ListProps, 'children' | 'itemCount' | 'width' | 'height'> {

  treeRef?: MutableRefObject<VariableSizeTree<
    TreeNodeData<TLeaf, TParent>
  > | null>
  tree: TParent

  defaultItemSize: number
  showRoot?: boolean

  /**
   * If true, calculate the size of each child node
   */
  shouldMeasure?: boolean
  /**
   * See `react-window` `overscanCount`. Defaults to 20
   */
  overscanCount?: number

  /**
   * If specified, automatically indent children elements by the specified size in REM units
   */
  indentSize?: number

  onNodePress?: OnNodePress<TLeaf, TParent>
  onNodeKeyDown?: OnNodeKeyDown<TLeaf, TParent>
}

export interface LeafProps<T> {
  leaf: T
  depth: number
  remeasure: () => void
}

export interface ParentProps<T> {
  parent: T
  depth: number
  isOpen: boolean
  setOpen: (isOpen: boolean) => void
  remeasure: () => void
}

export interface RenderFunctions<TLeaf, TParent> {
  onRenderLeaf: (props: LeafProps<TLeaf>) => JSX.Element

  onRenderParent: (props: ParentProps<TParent>) => JSX.Element | null
}

export type ChildComponentProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = NodeComponentProps<TreeNodeData<TLeaf, TParent>, VariableSizeNodePublicState<TreeNodeData<TLeaf, TParent>>> & {
  onNodePress?: OnNodePress<TLeaf, TParent>
  onNodeKeyDown?: OnNodeKeyDown<TLeaf, TParent>
}

export interface InternalChildProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> extends ChildComponentProps<TLeaf, TParent>, RenderFunctions<TLeaf, TParent> {
  indentSize?: number
  showRoot?: boolean
  shouldMeasure?: boolean
}

export interface InternalOnRenderChildProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> extends Pick<ChildComponentProps<TLeaf, TParent>, 'data' | 'isOpen' | 'setOpen'>, RenderFunctions<TLeaf, TParent> {
  remeasure: () => void
}

// Base

export interface NodeBase {
  id: string
}

export interface ParentTreeBase<T extends LeafTreeBase> extends NodeBase {
  children: Array<ParentTreeBase<T> | T>
}

export type LeafTreeBase = NodeBase

export interface TreeNode<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> {
  data: TreeNodeData<TLeaf, TParent>
}

export type TreeNodeData<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = SpecificTreeNode<TLeaf | TParent>

export interface SpecificTreeNode<T> {
  id: string
  nestingLevel: number
  node: T
  isOpenByDefault: boolean
  defaultHeight: number
  isFirst: boolean
}

type NodeCallbackData<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = Pick<ChildComponentProps<TLeaf, TParent>, 'isOpen' | 'setOpen'> & (
  {
    type: 'leaf'
    data: SpecificTreeNode<TLeaf>
  } | {
    type: 'parent'
    data: SpecificTreeNode<TParent>
  }
)

export type OnNodePress<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = (node: NodeCallbackData<TLeaf, TParent>, event: PressEvent) => void

export type OnNodeKeyDown<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = (node: NodeCallbackData<TLeaf, TParent>, event: React.KeyboardEvent<HTMLDivElement>) => void

export const isParent = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>(
    input: TLeaf | TParent,
  ): input is TParent => {
  return 'children' in input
}

export const createPressEventNode = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>(data: TreeNodeData<TLeaf, TParent>, isOpen: boolean, setOpen: (state: boolean) => Promise<void>) => {
  return isParent(data.node) ? {
    type: 'parent' as const,
    data: data as SpecificTreeNode<TParent>,
    isOpen,
    setOpen,
  } : {
    type: 'leaf' as const,
    data: data as SpecificTreeNode<TLeaf>,
    isOpen,
    setOpen,
  }
}

export const treeChildClass = 'treeChild'
