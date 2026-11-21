import { randomUUID } from 'crypto'

const value = randomUUID()

export const getMetadataHeaderValue = () => value
