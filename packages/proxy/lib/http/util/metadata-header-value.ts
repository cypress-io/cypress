import { randomUUID } from 'crypto'

let value: string | undefined

// Created on first use so the V8 snapshot does not bake in one value for every install
export const getMetadataHeaderValue = () => {
  return value ??= randomUUID()
}
