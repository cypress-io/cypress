import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '../../.test'
import { templateRef } from '.'

describe('templateRef', () => {
  it('should be defined', () => {
    expect(templateRef).toBeDefined()
  })

  it('string ref mount', () => {
    const refKey = 'target'

    const vm = mount(defineComponent({
      setup() {
        const targetEl = templateRef<HTMLElement | null>(refKey, null)
        return { targetEl }
      },
      render() {
        return h('div', { ref: refKey })
      },
    }))

    expect(vm.targetEl).toBe(vm.$el)
  })

  it('string ref update', async() => {
    const vm = mount(defineComponent({
      setup() {
        const refKey = ref('foo')
        const fooEl = templateRef<HTMLElement | null>('foo', null)
        const barEl = templateRef<HTMLElement | null>('bar', null)
        return {
          refKey,
          fooEl,
          barEl,
        }
      },
      render() {
        return h('div', { ref: this.refKey })
      },
    }))

    expect(vm.fooEl).toBe(vm.$el)
    expect(vm.barEl).toBe(null)

    vm.refKey = 'bar'
    await nextTick()

    expect(vm.fooEl).toBe(null)
    expect(vm.barEl).toBe(vm.$el)
  })

  it('string ref unmount', async() => {
    const vm = mount(defineComponent({
      setup() {
        const toggle = ref(true)
        const targetEl = templateRef<HTMLElement | null>('target', null)
        return {
          toggle,
          targetEl,
        }
      },
      render() {
        return this.toggle ? h('div', { ref: 'target' }) : null
      },
    }))

    expect(vm.targetEl).toBe(vm.$el)

    vm.toggle = false
    await nextTick()

    expect(vm.targetEl).toBe(null)
  })
})
