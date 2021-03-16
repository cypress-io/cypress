import React from 'react'
import cs from 'classnames'
import { FileNode, Folder } from './helpers/makeFileHierarchy'
import styles from './FileExplorer.module.scss'

export interface FileExplorerProps {
  className?: string
  files: FileNode[]
  folderComponent: any
  fileComponent: any
}

export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
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
        toggleFile={toggleFile}
        openFiles={openFiles}
        depth={0}
      />
    </nav>
  )
}

export interface FileTreeProps {
  files: FileNode[]
  depth: number
  fileComponent: any
  folderComponent: any
  openFiles: Record<string, boolean>
  style?: React.CSSProperties
  toggleFile: (absolute: string) => void
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
        depth={props.depth + 1}
        files={props.openFiles[item.absolute] ? item.files : []}
      />
    )
  }

  const renderFolder = (item: Folder) => {
    return (
      <props.folderComponent 
        depth={props.depth} 
        name={item.name} 
        isOpen={props.openFiles[item.absolute]}
        onClick={() => props.toggleFile(item.absolute)}
      />
    )
  }

  const renderFile = (item: FileNode) => {
    return (
      <props.fileComponent 
        depth={props.depth} 
        name={item.name} 
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
                className={styles.a}
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
