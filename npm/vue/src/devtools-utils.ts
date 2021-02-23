// @ts-nocheck - Vue 2 types are awful

interface ComponentMeta {
  _uid: number
  name: string
  children: ComponentMeta[]
  data: Record<any, any>
}

export const getComponentHierarchy = (instance: Vue): ComponentMeta[] => {
  const getData = (data: any) => {
    const d = {}
    Object.keys(data).forEach(k => {
      d[k] = data[k]
    })
    return d
  }

  return instance.$children.map(child => {
    return {
      _uid: child._uid,
      name: child.$options._componentTag || 'Anonymous',
      data: getData(child.$data),
      children: []
    }
  })
}