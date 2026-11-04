import { describe, it, expect, expectTypeOf } from 'vitest'
import type {
  AutomationCommands,
  NativeInputActionsParams,
  NativeInputKeySource,
  NativeInputPointerSource,
  NativeInputPointerType,
  NativeInputWheelSource,
} from '../src'

describe('native input automation payloads', () => {
  it('builds a pointer source for each pointer type', () => {
    const pointerTypes: NativeInputPointerType[] = ['mouse', 'pen', 'touch']

    const sources = pointerTypes.map((pointerType): NativeInputPointerSource => {
      return {
        type: 'pointer',
        id: pointerType,
        parameters: { pointerType },
        actions: [
          { type: 'pointerMove', x: 10, y: 20 },
          { type: 'pointerDown', button: 0, pressure: 0.5 },
          { type: 'pause', duration: 50 },
          { type: 'pointerUp', button: 0 },
        ],
      }
    })

    expect(sources.map((source) => source.parameters.pointerType)).toEqual(pointerTypes)
  })

  it('builds a key source', () => {
    const source: NativeInputKeySource = {
      type: 'key',
      id: 'keyboard',
      actions: [
        { type: 'keyDown', value: 'Shift' },
        { type: 'keyDown', value: 'a' },
        { type: 'keyUp', value: 'a' },
        { type: 'pause', duration: 0 },
        { type: 'keyUp', value: 'Shift' },
      ],
    }

    expect(source.actions).toHaveLength(5)
  })

  it('builds a wheel source', () => {
    const source: NativeInputWheelSource = {
      type: 'wheel',
      id: 'wheel',
      actions: [
        { type: 'scroll', x: 100, y: 100, deltaX: 0, deltaY: 250 },
        { type: 'pause', duration: 10 },
      ],
    }

    expect(source.actions[0]).toMatchObject({ deltaY: 250 })
  })

  it('types the input:actions and input:reset automation commands', () => {
    expectTypeOf<AutomationCommands['input:actions']['dataType']>().toEqualTypeOf<NativeInputActionsParams>()
    expectTypeOf<AutomationCommands['input:actions']['returnType']>().toEqualTypeOf<void>()
    expectTypeOf<AutomationCommands['input:reset']['dataType']>().toEqualTypeOf<Record<string, never>>()
    expectTypeOf<AutomationCommands['input:reset']['returnType']>().toEqualTypeOf<void>()
  })

  it('rejects actions that do not belong to the source type', () => {
    const pointer: NativeInputPointerSource = {
      type: 'pointer',
      id: 'mouse',
      parameters: { pointerType: 'mouse' },
      // @ts-expect-error a pointer source cannot press keys
      actions: [{ type: 'keyDown', value: 'a' }],
    }

    const key: NativeInputKeySource = {
      type: 'key',
      id: 'keyboard',
      // @ts-expect-error a key source cannot scroll
      actions: [{ type: 'scroll', x: 0, y: 0, deltaX: 0, deltaY: 10 }],
    }

    const wheel: NativeInputWheelSource = {
      type: 'wheel',
      id: 'wheel',
      // @ts-expect-error a wheel source cannot move a pointer
      actions: [{ type: 'pointerMove', x: 0, y: 0 }],
    }

    const params: NativeInputActionsParams = {
      // @ts-expect-error pointerType must be mouse, pen or touch
      sources: [{ type: 'pointer', id: 'stylus', parameters: { pointerType: 'stylus' }, actions: [] }],
    }

    expect([pointer, key, wheel, params]).toHaveLength(4)
  })
})
