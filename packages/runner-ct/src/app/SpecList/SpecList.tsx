/// <reference types="cypress" />

import React, { useCallback, useMemo, useRef } from 'react'
import cs from 'classnames'
import { throttle } from 'lodash'
import { SearchInput, FileTree, treeChildClass, SpecificTreeNode, TreeFile, FileBase } from '@cypress/design-system'

import { useFuzzySort } from './useFuzzySort'

import styles from './SpecList.module.scss'

export interface SpecListProps {
  className?: string

  specs: Cypress.Cypress['spec'][]
  selectedFile?: string
  searchRef: React.MutableRefObject<HTMLInputElement>
  onFileClick: (path: string) => void
}

const fuzzyTransform = <T, >(node: T, indexes: number[]) => ({
  ...node,
  indexes,
})

export const SpecList: React.FC<SpecListProps> = ({ searchRef, className, specs, selectedFile, onFileClick }) => {
  const files = useMemo(() => specs.map((spec) => ({ path: spec.relative })), [specs])

  const { search, setSearch, matches } = useFuzzySort({
    search: '',
    transformResult: fuzzyTransform,
    items: files,
    options: { key: 'path' },
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInput = useMemo(() => throttle(setSearch, 100), [])

  const onFilePress = useCallback((file: SpecificTreeNode<TreeFile<FileBase>>) => onFileClick(file.node.id), [onFileClick])
  const onEnter = useCallback(() => {
    const firstChild = ref.current.querySelector(`.${treeChildClass}`)

    if (!firstChild) {
      return
    }

    (firstChild as HTMLElement).focus()
  }, [])

  const ref = useRef<HTMLDivElement>()

  return (
    <nav
      className={cs(styles.nav, className)}
      data-cy='specs-list'
    >
      <SearchInput
        className={styles.searchInput}
        inputRef={searchRef}
        value={search}
        placeholder='Find spec...'
        aria-label="Search specs"
        onInput={onInput}
        onEnter={onEnter}
      />
      {/* Tree requires a wrapping div when nested below flex or grid */}
      <div ref={ref}>
        {/* TODO: Do we need any other rootDirectories? */}
        <FileTree files={matches} rootDirectory="/" emptyPlaceholder="No specs found" onFilePress={onFilePress} />
      </div>
    </nav>
  )
}
