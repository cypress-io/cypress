import React from 'react'
import cs from 'classnames'
import fuzzysort from 'fuzzysort'
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
  specs: Cypress.Cypress['spec'][]
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

interface NodeWithMatch extends Omit<FileNode, 'type'> {
  indexes: number[]
}

export interface FileTreeProps extends FileExplorerProps {
  depth: number
  openFolders: Record<string, boolean>
  style?: React.CSSProperties
  matches: NodeWithMatch[]
  search: string | undefined
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
  const [search, setSearch] = React.useState('srcomplaygroun')

  const matches = fuzzysort.go(search, props.specs, { key: 'relative' }).map((x) => {
    const split = x.obj.absolute.split('/')
    const name = split[split.length - 1]

    return {
      ...x.obj,
      absolute: x.obj.relative,
      name,
      indexes: x.indexes,
    }
  })

  React.useLayoutEffect(() => {
    const openFoldersTmp: Record<string, boolean> = {}

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
      const isVisible = (node: TreeNode, matches: NodeWithMatch[]) => matches.some((x) => x.absolute.includes(node.absolute))

      for (const node of nodes) {
        if (node.type === 'folder') {
          // only update with newly created folders.
          // we want to maintain the current state (open/closed) of existing folders.
          if (openFolders[node.absolute]) {
            if (isVisible(node, matches)) {
              files.push(node)
              flatten(node.files)
            }
          } else {
            if (isVisible(node, matches)) {
              files.push(node)
            }
          }
        } else {
          if (isVisible(node, matches)) {
            files.push(node)
          }
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

  return (
    <nav
      className={cs(props.className, props.cssModule && props.cssModule.nav)}
      onKeyDown={handleKeyDown}
      data-cy='specs-list'
    >

      <input value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
      <FileTree
        {...props}
        search={search ? search : undefined}
        matches={matches}
        files={props.files}
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
        {...props}
        depth={props.depth + 1}
        files={props.openFolders[item.absolute] ? item.files : []}
      />
    )
  }

  const checkMatch = (item: TreeNode, matches: NodeWithMatch[]) => matches.find((match) => match.absolute.startsWith(item.absolute))

  const renderFolder = (item: FolderNode) => {
    const render = (indexes: number[]) => (
      <props.folderComponent
        depth={props.depth}
        indexes={indexes}
        item={item}
        isOpen={props.openFolders[item.absolute]}
        onClick={() => props.setSelectedFile(item.absolute)}
      />
    )

    // if no search entered we just show all the specs.
    if (props.search === undefined) {
      return render([])
    }

    const match = checkMatch(item, props.matches)

    if (!match) {
      return <span />
    }

    return render(match.indexes)
  }

  const renderFile = (item: FileNode) => {
    const render = (indexes: number[]) => (
      <props.fileComponent
        depth={props.depth}
        indexes={indexes}
        item={item}
        onClick={props.onFileClick}
      />
    )

    // if no search entered we just show all the specs.
    if (props.search === undefined) {
      return render([])
    }

    const match = checkMatch(item, props.matches)

    if (!match) {
      return <span />
    }

    return render(match.indexes)
  }

  return (
    <>
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
