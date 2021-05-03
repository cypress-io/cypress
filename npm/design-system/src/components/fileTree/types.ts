import type { PressEvent } from '@react-types/shared'
import type { MutableRefObject, ReactNode } from 'react'

import { LeafProps, ParentProps, SpecificTreeNode, VirtualizedTreeRef } from 'components/virtualizedTree/types'

export interface FileTreeProps<T extends FileBase> {
  /**
   * Use instead of `ref`. React/TS still doesn't have a good solution for `forwardRef` generics
   */
  innerRef?: MutableRefObject<VirtualizedTreeRef>

  files: T[]
  rootDirectory: string

  emptyPlaceholder: ReactNode

  /**
   * If specified, offset tree nodes by this amount in REM
   */
  leftOffset?: number

  onRenderFolder?: (folder: ParentProps<TreeFolder<T>>) => JSX.Element
  onRenderFile?: (folder: LeafProps<TreeFile<T>>) => JSX.Element

  onFolderPress?: (folder: SpecificTreeNode<TreeFolder<T>>, event: FilePressEvent) => void
  onFilePress?: (file: SpecificTreeNode<TreeFile<T>>, event: FilePressEvent) => void

  onFolderKeyDown?: (folder: SpecificTreeNode<TreeFolder<T>>, event: React.KeyboardEvent<HTMLDivElement>) => void
  onFileKeyDown?: (file: SpecificTreeNode<TreeFile<T>>, event: React.KeyboardEvent<HTMLDivElement>) => void
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
  indexes?: number[]
  children: Array<TreeFolder<T> | TreeFile<T>>
}
