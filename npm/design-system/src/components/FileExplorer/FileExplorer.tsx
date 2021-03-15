import React from 'react'
import { makeFileHierarchy } from './helpers/makeFileHierarchy'
import { FileExplorerProps, FileTreeProps, FileLike, FolderOrFile } from './types'
import styles from './FileExplorer.module.scss'
import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'
import folderClosed from '@iconify/icons-vscode-icons/default-folder'
import folderOpen from '@iconify/icons-vscode-icons/default-folder-opened'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons'
import cs from 'classnames'

library.add(fas)

const icons: Record<string, any> = {
  js: { icon: javascriptIcon },
  ts: { icon: typescriptIcon },
  tsx: { icon: reactTs },
  jsx: { icon: reactJs },
  folderOpen: { icon: folderOpen },
  folderClosed: { icon: folderClosed },
}

const getExt = (path: string) => {
  const extensionMatches = path.match(/(?:\.([^.]+))?$/)

  return extensionMatches ? extensionMatches[1] : ''
}

export const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  return (<nav className={cs(props.className || '', styles.nav)}><FileTree files={makeFileHierarchy(props.files) || []} isSelected={props.isSelected || (() => {})} onClick={props.onClick || (() => {})}></FileTree></nav>)
}

export const FileTree: React.FC<FileTreeProps> = (props) => {
  const depth = props.depth || 0
  const [files, setFiles] = React.useState(props.files || [])

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

  const updateItem = (i: FolderOrFile, idx: number, prop: Partial<FileLike>) => {
    files[idx] = { ...i, ...prop }
    setFiles([...files])
  }

  return (
    <ul className={styles.ul}>
      {
        files.map((item, idx) => {
          const ext = getExt(item.shortName) || ''
          const folderIcon = item.isOpen ? icons.folderOpen : icons.folderClosed
          const inlineIconProps = ext ? icons[ext] : folderIcon

          function handleOnSelect (e: any) {
            const onItemClick = item.onClick || (() => {})

            onItemClick(e, item)
            props.onClick(item)
            updateItem(item, idx, { isOpen: !item.isOpen })
          }

          return (<React.Fragment key={item.shortName}>
            <a
              data-file={item.relative}
              key={item.shortName}
              style={inlineStyles.a}
              className={cs(styles.a, { [styles.isClosed]: !item.isOpen, [styles.isSelected]: props.isSelected(item) })}
              onKeyDown={(e) => e.key === ' ' || e.key === 'Enter' && handleOnSelect(e)}
              onClick={handleOnSelect}
              tabIndex={0}>
              <li
                style={{ ...props.style, ...inlineStyles.li }}
                className={styles.li}>
                { item.type === 'folder' &&
                    <FontAwesomeIcon
                      className={styles.folderIcon}
                      icon='chevron-up'
                      size='xs'
                      transform={{ rotate: item.isOpen ? 180 : 90 }} />
                }

                {<InlineIcon {...inlineIconProps} className={styles.brandIcon} />}
                { item.shortName }
              </li>
            </a>
            {
              item.type === 'folder' &&
              <FileTree
                depth={depth + 1}
                files={item.files}
                onClick={props.onClick}
                isSelected={props.isSelected}
              />
            }
          </React.Fragment>)
        })
      }
    </ul>
  )
}
