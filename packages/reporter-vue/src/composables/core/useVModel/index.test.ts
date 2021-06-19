import { isVue2 } from 'vue'
import { useVModel } from '.'
import { useSetup } from '../../.test'

describe('useVModel', () => {
  const defaultKey = isVue2 ? 'value' : 'modelValue'
  const defaultValue = 'default'
  const defaultProps = () => ({
    [defaultKey]: defaultValue,
  })

  const emitMock = jest.fn((event: string, values: any[]) => {})
  beforeEach(() => emitMock.mockClear())

  it('should work with default value', () => {
    useSetup(() => {
      const data = useVModel(defaultProps())
      expect(data.value).toBe(defaultValue)
    })
  })

  it('should work with arguments', () => {
    const props = {
      ...defaultProps(),
      data: 'data',
    }
    useSetup(() => {
      const data = useVModel(props, 'data')
      expect(data.value).toBe('data')
    })
  })

  it('should emit on value change', async() => {
    useSetup(() => {
      const data = useVModel(defaultProps(), undefined, emitMock)
      data.value = 'changed'
    })

    expect(emitMock.mock.calls[0][0]).toBe(isVue2 ? 'input' : 'update:modelValue')
    expect(emitMock.mock.calls[0][1]).toBe('changed')
  })

  it('should use eventName if set', async() => {
    useSetup(() => {
      const data = useVModel(defaultProps(), undefined, emitMock, { eventName: 'onChange' })
      data.value = 'changed'
    })

    expect(emitMock.mock.calls[0][0]).toBe('onChange')
  })
})
