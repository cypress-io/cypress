import React from 'react'
import {
  FileComponentProps,
  FolderComponentProps,
  FileExplorer,
  FileExplorerProps,
} from '../FileExplorer/FileExplorer'
import { makeFileHierarchy, TreeNode } from '../FileExplorer/helpers/makeFileHierarchy'

import { InlineIcon } from '@iconify/react'
import javascriptIcon from '@iconify/icons-vscode-icons/file-type-js-official'
import typescriptIcon from '@iconify/icons-vscode-icons/file-type-typescript-official'
import reactJs from '@iconify/icons-vscode-icons/file-type-reactjs'
import reactTs from '@iconify/icons-vscode-icons/file-type-reactts'
import folderClosed from '@iconify/icons-vscode-icons/default-folder'
import folderOpen from '@iconify/icons-vscode-icons/default-folder-opened'
import styles from './SpecList.module.scss'

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

const NameWithHighlighting: React.FC<{ item: TreeNode, indexes: number[] }> = (props) => {
  // key/value map for perf
  const map = props.indexes.reduce<Record<number, boolean>>((acc, curr) => ({ ...acc, [curr]: true }), {})

  const absolutePathHighlighted = props.item.absolute.split('').map<JSX.Element | string>((char, idx) => {
    if (map[idx]) {
      return <b>{char}</b>
    }

    return char
  })

  const nameOnly = absolutePathHighlighted.slice(absolutePathHighlighted.length - props.item.name.length)

  return <span key={props.item.absolute}>{nameOnly}</span>
}

const FileComponent: React.FC<FileComponentProps> = (props) => {
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

const FolderComponent: React.FC<FolderComponentProps> = (props) => {
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

interface SpecListProps extends Omit<
  FileExplorerProps, 'files' | 'fileComponent' | 'folderComponent' | 'cssModule'
> {
  specs: Cypress.Cypress['spec'][]
}

export const SpecList: React.FC<SpecListProps> = (props) => {
  const files = React.useMemo(() => makeFileHierarchy(props.specs.map((spec) => spec.relative)), [props.specs])

  return (
    <>
      <FileExplorer
        {...props}
        cssModule={styles}
        files={files}
        fileComponent={FileComponent}
        folderComponent={FolderComponent}
      />
    </>
  )
}
