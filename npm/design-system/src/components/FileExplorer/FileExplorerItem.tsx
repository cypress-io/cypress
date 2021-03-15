import React, { ReactNode } from 'react'
import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'
import folderClosed from '@iconify/icons-vscode-icons/default-folder'
import folderOpen from '@iconify/icons-vscode-icons/default-folder-opened'
import { FolderOrFile } from './types'
import styles from './FileExplorer.module.scss'
import cs from 'classnames'

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

export interface FileExplorerItemProps {
  item: FolderOrFile
  children?: ReactNode
  style?: React.CSSProperties
  getHref? (item: FolderOrFile): string
  depth: number
  onFocus: any
  onClick: any
  onBlur: any
}

export const FileExplorerItem: React.FC<FileExplorerItemProps> = (props) => {
  const ext = getExt(props.item.shortName) || ''
  const folderIcon = props.item.isOpen ? icons.folderOpen : icons.folderClosed
  const getHref = props.getHref || (() => '#')
  const onClick = props.item.onClick || (() => {})

  const inlineIconProps = ext ? icons[ext] : folderIcon

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

  return (
    <a
      style={inlineStyles.a}
      className={cs(styles.a, { [styles.isClosed]: !props.item.isOpen, [styles.isSelected]: props.item.isSelected })}
      href={getHref(props.item)}
      onFocus={(e) => {
        props.onFocus(e, props.item)
      }}
      onBlur={(e) => {
        props.onBlur(e, props.item)
      }}
      onClick={(e) => {
        props.onClick(e, props.item)
        onClick(e, props.item)
      }}
      tabIndex={0}>
      { props.item.isSelected }
      <li
        style={{ ...props.style, ...inlineStyles.li }}
        className={styles.li}>
        {<InlineIcon {...inlineIconProps} />}
        { props.children }
      </li></a>)
}
