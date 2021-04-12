import React from 'react'
import cs from 'classnames'
import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'
import folderClosed from '@iconify/icons-vscode-icons/default-folder'
import folderOpen from '@iconify/icons-vscode-icons/default-folder-opened'

import styles from './SpecList.module.scss'
import { FileNode, FolderNode, makeFileHierarchy, TreeNode } from './makeFileHierarchy'
import { SearchInput } from '../../../../../npm/design-system/src/components/SearchInput/SearchInput'
import { useFuzzySort } from './useFuzzySort'

export const icons: Record<string, any> = {
  js: { icon: javascriptIcon },
  ts: { icon: typescriptIcon },
  tsx: { icon: reactTs },
  jsx: { icon: reactJs },
  folderOpen: { icon: folderOpen },
  folderClosed: { icon: folderClosed },
}

export interface SpecListProps extends React.HTMLAttributes<HTMLDivElement> {
  specs: Cypress.Cypress['spec'][]
  selectedFile?: string
  searchRef: React.MutableRefObject<HTMLInputElement>
  focusSpecList: () => void
  onFileClick: (file: FileNode) => void
}

interface NodeWithMatch extends Omit<FileNode, 'type'> {
  indexes: number[]
}

export interface FileTreeProps extends SpecListProps {
  depth: number
  files: TreeNode[]
  openFolders: Record<string, boolean>
  matches: NodeWithMatch[]
  search: string | undefined
  setSelectedFile: (relative: string) => void
}

export interface NodeComponentProps<T> {
  item: T
  depth: number
  indexes: number[]
}

export interface FileComponentProps extends NodeComponentProps<FileNode> {
  onClick: (file: FileNode) => void
}

export interface FolderComponentProps extends NodeComponentProps<FolderNode> {
  isOpen: boolean
  onClick: () => void
}

export const FileComponent: React.FC<FileComponentProps> = (props) => {
  const ext = getExt(props.item.name)
  const inlineIconProps = ext && icons[ext]

  return (
    <div
      onClick={() => props.onClick(props.item)}
    >
      <InlineIcon {...inlineIconProps} />
      <NameWithHighlighting
        item={props.item}
        indexes={props.indexes}
      />
    </div>
  )
}

export const FolderComponent: React.FC<FolderComponentProps> = (props) => {
  const inlineIconProps = props.isOpen ? icons.folderOpen : icons.folderClosed

  return (
    <div onClick={props.onClick}>
      <InlineIcon {...inlineIconProps} />
      <NameWithHighlighting
        item={props.item}
        indexes={props.indexes}
      />
    </div>
  )
}

export const getExt = (path: string) => {
  const extensionMatches = path.match(/(?:\.([^.]+))?$/)

  return extensionMatches ? extensionMatches[1] : ''
}

export const NameWithHighlighting: React.FC<{ item: TreeNode, indexes: number[] }> = (props) => {
  // key/value map for perf
  const map = props.indexes.reduce<Record<number, string>>((acc, curr, idx) => ({ ...acc, [curr]: `${curr}-${idx}` }), {})

  const absolutePathHighlighted = props.item.relative.split('').map<JSX.Element | string>((char, idx) => {
    return (
      <React.Fragment key={map[idx]}>
        {map[idx] ? (
          <b>
            {char}
          </b>
        ) : char}
      </React.Fragment>
    )
  })

  const nameOnly = absolutePathHighlighted.slice(absolutePathHighlighted.length - props.item.name.length)

  return (
    <span key={props.item.relative}>
      {nameOnly}
    </span>
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
        files={props.openFolders[item.relative] ? item.files : []}
      />
    )
  }

  const checkMatch = (item: TreeNode, matches: NodeWithMatch[]) => matches.find((match) => match.relative.startsWith(item.relative))

  const renderFolder = (item: FolderNode) => {
    const render = (indexes: number[]) => (
      <FolderComponent
        depth={props.depth}
        indexes={indexes}
        item={item}
        isOpen={props.openFolders[item.relative]}
        onClick={() => props.setSelectedFile(item.relative)}
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
      <FileComponent
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
    <ul className={styles && styles.ul}>
      {
        props.files.map((item) => {
          return (
            <React.Fragment key={item.relative}>
              <a
                data-item={item.relative}
                style={{
                  marginLeft: `-${20 * props.depth}px`,
                  width: `calc(100% + (20px * ${props.depth}))`,
                }}
                className={cs(styles.a, {
                  [styles.isSelected]: item.relative === props.selectedFile,
                })}
                tabIndex={0}
              >
                <li
                  style={{ marginLeft: `${20 * props.depth}px` }}
                  className={styles.li}
                >
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

const fuzzyTransform = (spec: Cypress.Cypress['spec'], indexes: number[]) => {
  const split = spec.relative.split('/')
  const name = split[split.length - 1]

  return {
    relative: spec.relative,
    name,
    indexes,
  }
}

export const SpecList: React.FC<SpecListProps> = (props) => {
  const files = React.useMemo(() => makeFileHierarchy(props.specs.map((spec) => spec.relative)), [props.specs])

  /**
   * Whether a folder is open or not is a **UI** concern.
   * From a file system point of view, there is no such concept as "open" or "closed",
   * only from a user's point of view.
   * For this reason we save the open state as part of the UI component. The easiest
   * way to do this is a key/value pair, mapping the relative path of a directory to a boolean
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
  const { search, setSearch, matches } = useFuzzySort({
    search: '',
    transformResult: fuzzyTransform,
    items: props.specs,
    options: { key: 'relative' },
  })

  React.useLayoutEffect(() => {
    const openFoldersTmp: Record<string, boolean> = {}

    function walk (nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          // only update with newly created folders.
          // we want to maintain the current state (open/closed) of existing folders.
          if (!(node.relative in openFoldersTmp)) {
            openFoldersTmp[node.relative] = true
          }

          walk(node.files)
        }
      }
    }

    walk(files)
    setOpenFolders(openFoldersTmp)
  }, [files])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // no need to do anything since the key pressed is not a navigation key.
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      return
    }

    const flattenedFiles: TreeNode[] = []

    const isVisible = (node: TreeNode, matches: NodeWithMatch[]) => {
      // if no search is entered, assume everything matches.
      if (search === '') {
        return true
      }

      return matches.some((x) => {
        return x.relative.includes(node.relative)
      })
    }

    // flatten *visible* files/folders. This means if a folder is closed, we do
    // not include the contents - this is for keyboard navigation, and we only want
    // to navigate to files or folders that are visible in the UI.
    function flatten (nodes: TreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          // only update with newly created folders.
          // we want to maintain the current state (open/closed) of existing folders.
          if (openFolders[node.relative]) {
            if (isVisible(node, matches)) {
              flattenedFiles.push(node)
              flatten(node.files)
            }
          } else {
            if (isVisible(node, matches)) {
              flattenedFiles.push(node)
            }
          }
        } else {
          if (isVisible(node, matches)) {
            flattenedFiles.push(node)
          }
        }
      }
    }

    flatten(files)

    const selectSpecByIndex = (index: number) => {
      // pressed up arrow on the first spec in the list.
      // we should move up and focus the search field.
      if (index < 0) {
        return props.focusSpecList()
      }

      // do not allow going past the last spec
      if (index >= flattenedFiles.length) {
        return
      }

      const file = flattenedFiles[index]
      const specElement = document.querySelector(`[data-item="${file.relative}"]`) as HTMLDivElement

      if (specElement) {
        specElement.focus()
      }
    }

    const selectedSpecIndex = flattenedFiles.findIndex((file) => {
      return file.relative === (document.activeElement as HTMLElement).dataset.item
    })

    if (e.key === 'Enter') {
      const selected = flattenedFiles[selectedSpecIndex]

      if (!selected) {
        return // enter key doesn't do anything if we couldn't find any specs
      }

      if (selected.type === 'file') {
        // Run the spec.
        props.onFileClick(selected)
      }

      // Toggle the folder open/closed.
      return setSelectedFile(selected.relative)
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()

      return selectSpecByIndex(selectedSpecIndex - 1)
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()

      return selectSpecByIndex(selectedSpecIndex + 1)
    }
  }

  const setSelectedFile = (relative: string) => {
    setOpenFolders({ ...openFolders, [relative]: !openFolders[relative] })
  }

  return (
    <nav
      className={cs(props.className, styles.nav)}
      data-cy='specs-list'
      onKeyDown={handleKeyDown}
    >
      <SearchInput
        value={search}
        placeholder='Find spec...'
        prefixIcon='search'
        inputRef={props.searchRef}
        onChange={(e) => setSearch(e.currentTarget.value)}
        onSuffixClicked={() => setSearch('')}
      />
      <FileTree
        {...props}
        search={search ? search : undefined}
        matches={matches}
        files={files}
        setSelectedFile={setSelectedFile}
        openFolders={openFolders}
        depth={0}
      />
    </nav>
  )
}
