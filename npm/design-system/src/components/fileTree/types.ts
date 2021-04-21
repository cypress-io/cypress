import type { PressEvent } from '@react-types/shared'
import { SpecificTreeNode } from 'components/virtualizedTree/types'

export interface FileTreeProps<T extends FileBase> {
  files: T[]
  rootDirectory: string

  onFolderPress?: (folder: SpecificTreeNode<TreeFolder<T>>, event: FilePressEvent) => void
  onFilePress?: (file: SpecificTreeNode<TreeFile<T>>, event: FilePressEvent) => void
}

export interface FilePressEvent extends PressEvent {
  readonly defaultPrevented: boolean
  preventDefault: () => void
}

export interface FileBase {
  path: string
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
