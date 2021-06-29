import { useSetup } from '../../.test'
import { autoResetRef } from '.'
import { ref } from 'vue'

describe('autoResetRef', () => {
  it('should be defined', () => {
    expect(autoResetRef).toBeDefined()
  })

  it('should be default at first', () => {
    useSetup(() => {
      const val = autoResetRef('default', 100)
      expect(val.value).toBe('default')
    })
  })

  it('should be updated', () => {
    useSetup(() => {
      const val = autoResetRef('default', 100)

      val.value = 'update'
      expect(val.value).toBe('update')
    })
  })

  it('should be reset', () => {
    useSetup(async() => {
      const val = autoResetRef('default', 100)
      val.value = 'update'

      await new Promise(resolve => setTimeout(resolve, 100 + 1))

      expect(val.value).toBe('default')
    })
  })

  it('should change afterMs', () => {
    useSetup(async() => {
      const afterMs = ref(150)
      const val = autoResetRef('default', afterMs)
      val.value = 'update'
      afterMs.value = 100

      await new Promise(resolve => setTimeout(resolve, 100 + 1))
      expect(val.value).toBe('update')

      await new Promise(resolve => setTimeout(resolve, 50))
      expect(val.value).toBe('default')

      val.value = 'update'

      await new Promise(resolve => setTimeout(resolve, 100 + 1))
      expect(val.value).toBe('default')
    })
  })
})
