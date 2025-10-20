type ComputedStyles = {
  width: number
  height: number
  overflowHidden: boolean
  opacity: number
  visibility: string
  display: string
  transform: string
  position: string
  zIndex: number
  parentWidth: number
  parentHeight: number
  parentOverflowHidden: boolean
  boundingClientRect: DOMRect
  overflowX: string
  overflowY: string
  overflow: string
}

export class ComputedStyleSnapshot extends Map {
  constructor (styles?: Partial<ComputedStyles>) {
    super(Object.entries(styles ?? {}))
  }

  get <K extends keyof ComputedStyles> (key: K): ComputedStyles[K] | undefined {
    return super.get(key)
  }

  set<K extends keyof ComputedStyles> (key: K, value: ComputedStyles[K]): this {
    return super.set(key, value)
  }

  delete<K extends keyof ComputedStyles> (key: K): boolean {
    return super.delete(key)
  }

  has<K extends keyof ComputedStyles> (key: K): boolean {
    return super.has(key)
  }
}
