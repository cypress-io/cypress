import { useSetup } from '../../.test'
import { toRefs } from '.'
import { reactive, ref } from 'vue'

describe('toRefs', () => {
  it('should be defined', () => {
    expect(toRefs).toBeDefined()
  })

  it('should behave as vue\'s toRefs when a normal object was passed', () => {
    useSetup(() => {
      const obj = reactive({ a: 'a', b: 0 })
      const refs = toRefs(obj)
      expect(refs.a.value).toBe('a')
      expect(refs.b.value).toBe(0)

      obj.a = 'b'
      obj.b = 1
      expect(refs.a.value).toBe('b')
      expect(refs.b.value).toBe(1)
    })
  })

  it('should behave as vue\'s toRefs when a normal array was passed', () => {
    useSetup(() => {
      const arr = reactive(['a', 0])
      const refs = toRefs(arr)
      expect(refs[0].value).toBe('a')
      expect(refs[1].value).toBe(0)

      arr[0] = 'b'
      arr[1] = 1
      expect(refs[0].value).toBe('b')
      expect(refs[1].value).toBe(1)
    })
  })

  it('should return refs when a object ref was passed', () => {
    useSetup(() => {
      const obj = ref({ a: 'a', b: 0 })
      const refs = toRefs(obj)
      expect(refs.a.value).toBe('a')
      expect(refs.b.value).toBe(0)

      obj.value.a = 'b'
      obj.value.b = 1
      expect(refs.a.value).toBe('b')
      expect(refs.b.value).toBe(1)
    })
  })

  it('should return refs when a array ref was passed', () => {
    useSetup(() => {
      const arr = ref(['a', 0])
      const refs = toRefs(arr)
      expect(refs[0].value).toBe('a')
      expect(refs[1].value).toBe(0)

      arr.value[0] = 'b'
      arr.value[1] = 1
      expect(refs[0].value).toBe('b')
      expect(refs[1].value).toBe(1)
    })
  })
})
