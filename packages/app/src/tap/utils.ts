// Build a wire entry by assigning every field, then drop the null/undefined
// ones in one pass. The driver nulls evicted attrs and leaves unset fields
// undefined, and the wire contract's optional fields are absent-not-null — so
// pruning here beats guarding each assignment at its key.
export const omitNullish = <T extends object>(entry: T): T => {
  return (Object.keys(entry) as Array<keyof T>).reduce((pruned, key) => {
    if (entry[key] != null) {
      pruned[key] = entry[key]
    }

    return pruned
  }, {} as T)
}
