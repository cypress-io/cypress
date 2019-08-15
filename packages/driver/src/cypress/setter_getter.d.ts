type SetterGetter<S> = {
  <K extends keyof S, T extends S[K]>(key: K): T
  <K extends keyof S, T extends S[K]>(key: K, value: T): T
}
