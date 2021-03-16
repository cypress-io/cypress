type CypressSpec = Cypress.Cypress['spec']

export type FolderOrFile = File | Folder

type FolderOrFileType = 'file' | 'folder'

interface FolderOrFileBase {
  type: FolderOrFileType
	name: string
  absolute: string
}

export interface File extends FolderOrFileBase {
	type: 'file'
}

export interface Folder extends FolderOrFileBase {
	type: 'folder'
  files: FolderOrFile[]
}

// export interface FileLike extends CypressSpec {
//   isOpen: boolean
//   name: string
//   onClick?: (e: React.MouseEvent, item: FileLike) => void
//   isSelected?: (item: FileLike) => void
// }

export interface FileNode {
  type: 'file' | 'folder'
  files: FolderOrFile[]
}