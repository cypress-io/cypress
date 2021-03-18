import React from 'react'
import {
  FileComponentProps,
  FolderComponentProps,
  FileExplorer,
  FileExplorerProps,
} from '../FileExplorer/FileExplorer'
import { makeFileHierarchy } from '../FileExplorer/helpers/makeFileHierarchy'

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

const FileComponent: React.FC<FileComponentProps> = (props) => {
  const ext = getExt(props.item.name)
  const inlineIconProps = ext && icons[ext]

  return (
    <div
      onClick={() => props.onClick(props.item)}
    >
      <InlineIcon {...inlineIconProps} />
      {props.item.name}
    </div>
  )
}

const FolderComponent: React.FC<FolderComponentProps> = (props) => {
  const inlineIconProps = props.isOpen ? icons.folderOpen : icons.folderClosed

  return (
    <div
      onClick={props.onClick}
    >
      <InlineIcon {...inlineIconProps} />
      {props.item.name}
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
