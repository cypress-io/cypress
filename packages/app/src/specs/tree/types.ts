import type { SpecsListFragment } from '../../generated/graphql'
import type { SpecTreeDirectoryNode, SpecTreeFileNode } from './deriveTree'

export type DirectoryNode = SpecTreeDirectoryNode<SpecsListFragment>;

export type ProjectConnectionStatus =
  | 'LOGGED_OUT'
  | 'NOT_CONNECTED'
  | 'NOT_FOUND'
  | 'ACCESS_REQUESTED'
  | 'UNAUTHORIZED'
  | 'CONNECTED';

export interface FuzzyIndexes {
  fuzzyIndexes?: {
    relative: number[]
    baseName: number[]
  }
}

export type FileNode = SpecTreeFileNode<SpecsListFragment & FuzzyIndexes>
