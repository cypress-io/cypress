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

export interface FileLike extends CypressSpec {
  isOpen: boolean
  name: string
  onClick?: (e: React.MouseEvent, item: FileLike) => void
  isSelected?: (item: FileLike) => void
}

export interface FileNode {
  type: 'file' | 'folder'
  files: FolderOrFile[]
}

export interface FileTreeProps extends FileExplorerProps {
  files: FolderOrFile[]
  depth?: number
  style?: React.CSSProperties
  // onClick: (item: FileLike) => void
  // isSelected: (item: FileLike) => void
}

export interface FileExplorerProps {
  className?: string
  files: FileLike[]
  // onClick: (item: FileLike) => void
  // isSelected: (item: FileLike) => void
  onFolderToggle: (folder: Folder) => void
  onFileSelect: (file: File) => void
}
