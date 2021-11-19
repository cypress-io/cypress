export type NonNullable <T> = T extends null | undefined ? never : T
