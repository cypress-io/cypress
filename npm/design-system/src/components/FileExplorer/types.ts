type CypressSpec = Cypress.Cypress['spec']

export type FolderOrFile = File | Folder

export interface File extends FileLike {
	type: 'file'
  shortName: string
  currentPath: string
}

export interface Folder extends FileLike {
	type: 'folder'
	shortName: string
  files: FolderOrFile[]
  currentPath: string
}

export interface FileLike extends Partial<CypressSpec> {
  isOpen: boolean
  name: string
  onClick?: (e: React.MouseEvent, item: FileLike) => any
  isSelected?: (item: FileLike) => any
}

export interface FileNode {
  type: 'file' | 'folder'
  files: FolderOrFile[]
}

export interface FileTreeProps {
  files: FolderOrFile[]
  depth?: number
  style?: React.CSSProperties
  onClick: (item: FileLike) => any
  isSelected: (item: FileLike) => any
}

export interface FileExplorerProps {
  files: FileLike[]
  onClick: (item: FileLike) => any
  isSelected: (item: FileLike) => any
  className?: string
}
