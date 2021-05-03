import { createContext, useContext } from 'react'

export const FileTreeSelectedContext = createContext<string | undefined>(undefined)

export const useSelectedId = () => useContext(FileTreeSelectedContext)
