import React from 'react'
import cs from 'classnames'
import { FileNode, Folder } from './helpers/makeFileHierarchy'
import styles from './FileExplorer.module.scss'

export interface FolderComponentProps {
  item: Folder
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
  files: FileNode[]
  fileComponent: React.FC<FileComponentProps>
  folderComponent: React.FC<FolderComponentProps>
  selectedFiles: string[]
}

export interface FileTreeProps extends FileExplorerProps {
  depth: number
  openFiles: Record<string, boolean>
  style?: React.CSSProperties
  toggleFile: (absolute: string) => void
  onFileClick: (file: FileNode) => void
}

export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  /**
   * Whether a directory is open or not is a **UI** concern.
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
   * Every directory is set to open by default. The nice thing here is if you add a new directory
   * or file via your file system (eg mkdir foo/bar && touch foo/bar/hello.js) it will be added
   * without losing the current state of open/closed directories.
   */
  const [openFiles, setOpenFiles] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    function walk(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          if (!openFiles[node.absolute]) {
            setOpenFiles((openFiles) => {
              return { ...openFiles, [node.absolute]: true }
            })
          }
          walk(node.files)
        }
      }
    }

    walk(props.files)
  }, [props.files, setOpenFiles])


  const toggleFile = (absolute: string) => {
    setOpenFiles({ ...openFiles, [absolute]: !openFiles[absolute] })
  }

  return (
    <nav className={cs(props.className, styles.nav)}>
      <FileTree
        fileComponent={props.fileComponent}
        folderComponent={props.folderComponent}
        files={props.files} 
        selectedFiles={props.selectedFiles}
        toggleFile={toggleFile}
        openFiles={openFiles}
        onFileClick={file => console.log(file)}
        depth={0}
      />
    </nav>
  )
}

export const FileTree: React.FC<FileTreeProps> = (props) => {
  // Negative margins let the <a> tag take full width (a11y)
  // while the <li> tag with text content can be positioned relatively
  // This gives us HTML + CSS-only highlight and click handling
  const inlineStyles = {
    a: {
      marginLeft: `calc(-20px * ${props.depth})`,
      width: `calc(100% + (20px * ${props.depth}))`,
    },
    li: {
      marginLeft: `calc(20px * ${props.depth})`,
    },
  }

  const fileTree = (item: FileNode) => {
    if (item.type !== 'folder') {
      return
    }

    return (
      <FileTree
        fileComponent={props.fileComponent}
        folderComponent={props.folderComponent}
        openFiles={props.openFiles}
        toggleFile={props.toggleFile}
        onFileClick={props.onFileClick}
        selectedFiles={props.selectedFiles}
        depth={props.depth + 1}
        files={props.openFiles[item.absolute] ? item.files : []}
      />
    )
  }

  const renderFolder = (item: Folder) => {
    return (
      <props.folderComponent 
        depth={props.depth} 
        item={item} 
        isOpen={props.openFiles[item.absolute]}
        onClick={() => props.toggleFile(item.absolute)}
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
    <ul className={styles.ul}>
      {
        props.files.map((item) => {
          return (
            <React.Fragment key={item.absolute}>
              <a
                style={inlineStyles.a}
                className={cs(styles.a, { [styles.isSelected]: props.selectedFiles.includes(item.absolute) })}
                tabIndex={0}
              >
                <li
                  style={{ ...props.style, ...inlineStyles.li }}
                  className={styles.li}>
                  {item.type === 'folder' && renderFolder(item)}
                  {item.type === 'file' && renderFile(item)}
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
