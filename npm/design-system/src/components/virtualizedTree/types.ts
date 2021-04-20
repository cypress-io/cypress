import { PressEvent } from '@react-types/shared'
import { NodeComponentProps } from 'react-vtree/dist/lib/Tree'
import { VariableSizeNodePublicState } from 'react-vtree/dist/lib/VariableSizeTree'

export interface NodeBase {
  id: string
}

export interface ParentTreeBase<T extends LeafTreeBase> extends NodeBase {
  children: Array<ParentTreeBase<T> | T>
}

export type LeafTreeBase = NodeBase

export const isParent = <
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
>(
    input: TLeaf | TParent,
  ): input is TParent => {
  return 'children' in input
}

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

export type ChildComponentProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = NodeComponentProps<TreeNodeData<TLeaf, TParent>, VariableSizeNodePublicState<TreeNodeData<TLeaf, TParent>>> & {
  onNodePress?: OnNodePress<TLeaf, TParent>
}
