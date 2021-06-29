import { defineComponent, h, PropType, computed } from 'vue'

export const StepContainer = defineComponent({
  props: {
    currentStep: {
      type: Number as PropType<number>,
      required: true,
    },
  },

  setup (props, ctx) {
    if (!ctx.slots.default) {
      throw Error('StepContainer requires at least one <step>')
    }

    const stepToRender = computed(() => {
      const matched = ctx.slots.default!().find((step) => {
        if (step.type !== Step || !step.props) {
          return
        }

        return step.props.stepNumber === props.currentStep
      })

      if (!matched) {
        throw Error(`Could not find step with with stepNumber: ${props.currentStep}`)
      }

      return matched
    })

    return () => stepToRender.value
  },
})

export const Step = defineComponent({
  name: 'Step',

  props: {
    stepNumber: {
      type: Number as PropType<number>,
      required: true,
    },
  },

  setup (props, ctx) {
    return () => h('div', { ...props, class: 'p-3' }, ctx.slots)
  },
})
