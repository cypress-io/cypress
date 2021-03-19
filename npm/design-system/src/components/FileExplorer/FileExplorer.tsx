import React from 'react'
import cs from 'classnames'
import { FileNode, FolderNode, TreeNode } from './helpers/makeFileHierarchy'

export { FileNode, FolderNode, TreeNode }

export interface FolderComponentProps {
  item: FolderNode
  depth: number
  isOpen: boolean
  indexes: number[]
  onClick: () => void
}

export interface FileComponentProps {
  item: FileNode
  depth: number
  indexes: number[]
  onClick: (file: FileNode) => void
}

export interface FileExplorerProps extends React.HTMLAttributes<HTMLDivElement> {
  files: TreeNode[]
  fileComponent: React.FC<FileComponentProps>
  folderComponent: React.FC<FolderComponentProps>
  selectedFile?: string
  searchInput?: JSX.Element
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

interface NodeWithMatch extends FileNode {
  indexes: number[]
}

export interface FileTreeProps extends FileExplorerProps {
  depth: number
  openFolders: Record<string, boolean>
  style?: React.CSSProperties
  matches: NodeWithMatch[]
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
    const openFoldersTmp:Record<string, boolean> = {}

    function walk (nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          // only update with newly created folders.
          // we want to maintain the current state (open/closed) of existing folders.
          if (!(node.absolute in openFoldersTmp)) {
            openFoldersTmp[node.absolute] = true
          }

          walk(node.files)
        }
      }
    }

    walk(props.files)
    setOpenFolders(openFoldersTmp)
  }, [props.files])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const files: TreeNode[] = []

    function flatten (nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          // only update with newly created folders.
          // we want to maintain the current state (open/closed) of existing folders.
          if (openFolders[node.absolute]) {
            files.push(node)
            flatten(node.files)
          } else {
            files.push(node)
          }
        } else {
          files.push(node)
        }
      }
    }

    flatten(props.files)

    const selectSpecByIndex = (index: number) => {
      const file = typeof index !== 'number' || index < 0
        ? files[0]
        : files[index]

      const specElement = document.querySelector(`[data-item="${file.absolute}"]`) as HTMLDivElement

      if (specElement) {
        specElement.focus()
      }
    }

    const selectedSpecIndex = files.findIndex((file) => {
      return file.absolute === (document.activeElement as HTMLElement).dataset.item
    })

    if (e.key === 'Enter') {
      const selected = files[selectedSpecIndex]

      if (selected.type === 'file') {
        // Run the spec.
        props.onFileClick(selected)
      }

      // Toggle the folder open/closed.
      return setSelectedFile(selected.absolute)
    }

    if (e.key === 'ArrowUp') {
      return selectSpecByIndex(selectedSpecIndex - 1)
    }

    if (e.key === 'ArrowDown') {
      return selectSpecByIndex(selectedSpecIndex + 1)
    }
  }

  const setSelectedFile = (absolute: string) => {
    setOpenFolders({ ...openFolders, [absolute]: !openFolders[absolute] })
  }

  // const playground = props.files.find
  let theFiles = props.files.map((x) => x)
  // @ts-ignore
  const match = { ...theFiles[0].files[0].files[4], indexes: [0, 1, 2, 10, 11, 15, 16, 17, 20, 21, 22] }
  const matches: NodeWithMatch[] = [match]

  // @ts-ignore
  theFiles[0].files[0].files[4] = match
  // console.log(theFiles)
  // console.log(matches)

  return (
    <nav
      className={cs(props.className, props.cssModule && props.cssModule.nav)}
      onKeyDown={handleKeyDown}
      data-cy='specs-list'
    >
      <FileTree
        {...props}
        matches={matches}
        files={theFiles}
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
        matches={props.matches}
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
    const hasMatch = props.matches.find((match) => match.absolute.startsWith(item.absolute))

    if (!hasMatch) {
      return <span />
    }

    const split = item.absolute.split('/')

    return (
      <props.folderComponent
        depth={props.depth}
        indexes={hasMatch.indexes}
        item={item}
        isOpen={props.openFolders[item.absolute]}
        onClick={() => props.setSelectedFile(item.absolute)}
      />
    )
  }

  const renderFile = (item: FileNode) => {
    const hasMatch = props.matches.find((match) => match.absolute.startsWith(item.absolute))

    if (!hasMatch) {
      return <span />
    }

    return (
      <props.fileComponent
        depth={props.depth}
        indexes={hasMatch.indexes}
        item={item}
        onClick={props.onFileClick}
      />
    )
  }

  return (
    <>
      {props.searchInput}
      <ul className={props.cssModule && props.cssModule.ul}>
        {
          props.files.map((item) => {
            return (
              <React.Fragment key={item.absolute}>
                <a
                  data-item={item.absolute}
                  style={{
                    marginLeft: `-${20 * props.depth}px`,
                    width: `calc(100% + (20px * ${props.depth}))`,
                  }}
                  className={cs(props.cssModule && props.cssModule.a, {
                    [props.cssModule && props.cssModule.isSelected]: item.absolute === props.selectedFile,
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
    </>
  )
}
