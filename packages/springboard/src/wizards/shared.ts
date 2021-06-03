import { ComponentOptions, defineComponent } from 'vue'

// any wizard step has the ability to emit this event
// to change the validity of the "next" button
export const defineWizardStep = <Props, State>(
  options: ComponentOptions<Props, State, {}, {}, {}, {}, {}, {}>,
) => {
  return defineComponent<Props, State, {}, {}, {}, {}, {}, {}>({
    ...options,
    emits: {
      setNextStepStatus: (val: boolean) => {
        return true
      },
    },
  })
}
