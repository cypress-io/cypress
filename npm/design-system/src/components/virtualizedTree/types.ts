import { PressEvent } from '@react-types/shared'
import { MutableRefObject } from 'react'
import { NodeComponentProps } from 'react-vtree/dist/lib/Tree'
import { VariableSizeNodePublicState } from 'react-vtree/dist/lib/VariableSizeTree'
import type { VariableSizeTree } from 'react-vtree'
import { ListProps } from 'react-window'

// Props

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
}

export interface InternalChildProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> extends ChildComponentProps<TLeaf, TParent>, RenderFunctions<TLeaf, TParent> {
  indentSize?: number
  showRoot?: boolean
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

export const isParent = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>(
    input: TLeaf | TParent,
  ): input is TParent => {
  return 'children' in input
}
