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

export interface TreeNodeData<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> {
  id: string
  nestingLevel: number
  node: TParent | TLeaf
  isOpenByDefault: boolean
  defaultHeight: number
}

export type ChildComponentProps<
  TLeaf extends LeafTreeBase,
  TParent extends ParentTreeBase<TLeaf>
> = NodeComponentProps<TreeNodeData<TLeaf, TParent>, VariableSizeNodePublicState<TreeNodeData<TLeaf, TParent>>>
