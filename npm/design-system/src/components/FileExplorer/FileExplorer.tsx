import React from 'react'
import cs from 'classnames'
import { FileNode, FolderNode, TreeNode } from './helpers/makeFileHierarchy'

export interface FolderComponentProps {
  item: FolderNode
  depth: number
  isOpen: boolean
  onClick: () => void
}

export interface FileComponentProps {
  item: FileNode
  depth: number
  onClick: (file: FileNode) => void
}

export interface FileExplorerProps extends React.HTMLAttributes<HTMLDivElement> {
  files: TreeNode[]
  fileComponent: React.FC<FileComponentProps>
  folderComponent: React.FC<FolderComponentProps>
  selectedFile?: string
  onFileClick: (file: FileNode) => void

  // Styles. They should be a *.module.scss.
  // TODO: Can we type these? Do we want to couple to CSS modules?
  cssModule?: {
    nav: any
    ul: any
    li: any
    a: any
    isSelected: any
  }
}

export interface FileTreeProps extends FileExplorerProps {
  depth: number
  openFolders: Record<string, boolean>
  style?: React.CSSProperties
  setSelectedFile: (absolute: string) => void
}

export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  /**
   * Whether a folder is open or not is a **UI** concern.
   * From a file system point of view, there is no such concept as "open" or "closed",
   * only from a user's point of view.
   * For this reason we save the open state as part of the UI component. The easiest
   * way to do this is a key/value pair, mapping the absolute path of a directory to a boolean
   *
   * {
   *   'foo': true,
   *   'foo/bar': true
   *   'foo/bar/qux': false
   * }
   *
   * Every directory is set to open by default. When you add a new directory
   * or file via your file system (eg mkdir foo/bar && touch foo/bar/hello.js) it will be added
   * without losing the current state of open/closed directories.
   */
  const [openFolders, setOpenFolders] = React.useState<Record<string, boolean>>({})

  React.useLayoutEffect(() => {
    function walk (nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          // only update with newly created folders.
          // we want to maintain the current state (open/closed) of existing folders.
          if (!(node.absolute in openFolders)) {
            setOpenFolders({ ...openFolders, [node.absolute]: true })
          }

          walk(node.files)
        }
      }
    }

    walk(props.files)
  }, [props.files, openFolders])

  const setSelectedFile = (absolute: string) => {
    setOpenFolders({ ...openFolders, [absolute]: !openFolders[absolute] })
  }

  return (
    <nav className={cs(props.className, props.cssModule && props.cssModule.nav)}>
      <FileTree
        {...props}
        setSelectedFile={setSelectedFile}
        openFolders={openFolders}
        depth={0}
      />
    </nav>
  )
}

export const FileTree: React.FC<FileTreeProps> = (props) => {
  // Negative margins let the <a> tag take full width (a11y)
  // while the <li> tag with text content can be positioned relatively
  // This gives us HTML + cssModule-only highlight and click handling
  const fileTree = (item: TreeNode) => {
    if (item.type !== 'folder') {
      return
    }

    return (
      <FileTree
        fileComponent={props.fileComponent}
        folderComponent={props.folderComponent}
        openFolders={props.openFolders}
        setSelectedFile={props.setSelectedFile}
        onFileClick={props.onFileClick}
        selectedFile={props.selectedFile}
        depth={props.depth + 1}
        cssModule={props.cssModule}
        files={props.openFolders[item.absolute] ? item.files : []}
      />
    )
  }

  const renderFolder = (item: FolderNode) => {
    return (
      <props.folderComponent
        depth={props.depth}
        item={item}
        isOpen={props.openFolders[item.absolute]}
        onClick={() => props.setSelectedFile(item.absolute)}
      />
    )
  }

  const renderFile = (item: FileNode) => {
    return (
      <props.fileComponent
        depth={props.depth}
        item={item}
        onClick={props.onFileClick}
      />
    )
  }

  return (
    <ul className={props.cssModule && props.cssModule.ul}>
      {
        props.files.map((item) => {
          return (
            <React.Fragment key={item.absolute}>
              <a
                style={{
                  marginLeft: `-${20 * props.depth}px`,
                  width: `calc(100% + (20px * ${props.depth}))`,
                }}
                className={cs(props.cssModule && props.cssModule.a, {
                  [props.cssModule && props.cssModule.isSelected]: props.selectedFile === item.absolute,
                })}
                tabIndex={0}
              >
                <li
                  style={{ ...props.style, marginLeft: `${20 * props.depth}px` }}
                  className={props.cssModule && props.cssModule.li}>
                  {item.type === 'folder' ? renderFolder(item) : renderFile(item)}
                </li>
              </a>
              {fileTree(item)}
            </React.Fragment>
          )
        })
      }
    </ul>
  )
}
