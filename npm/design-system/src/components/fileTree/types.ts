import type { PressEvent } from '@react-types/shared'

import { LeafProps, ParentProps, SpecificTreeNode } from 'components/virtualizedTree/types'

export interface FileTreeProps<T extends FileBase> {
  files: T[]
  rootDirectory: string

  onRenderFolder?: (folder: ParentProps<TreeFolder<T>>) => JSX.Element
  onRenderFile?: (folder: LeafProps<TreeFile<T>>) => JSX.Element

  onFolderPress?: (folder: SpecificTreeNode<TreeFolder<T>>, event: FilePressEvent) => void
  onFilePress?: (file: SpecificTreeNode<TreeFile<T>>, event: FilePressEvent) => void
}

export interface FilePressEvent extends PressEvent {
  readonly defaultPrevented: boolean
  preventDefault: () => void
}

export interface FileBase {
  path: string
  indexes?: number[]
}

export interface TreeFile<T extends FileBase> {
  id: string
  name: string
  file: T
}

export interface TreeFolder<T extends FileBase> {
  id: string
  name: string
  children: Array<TreeFolder<T> | TreeFile<T>>
}
