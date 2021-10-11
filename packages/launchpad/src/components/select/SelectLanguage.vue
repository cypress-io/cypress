<template>
  <div class="text-left relative">
    <label
      class="text-gray-800 text-sm my-3 block"
      :class="{ 'opacity-50': disabled }"
    >
      {{
        name
      }}
    </label>
    <div @click="() => selectOption('js')">
      js
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { EnvironmentSetupFragment, CodeLanguageEnum } from '../../generated/graphql'

const emit = defineEmits<{
  (event: 'select', type: CodeLanguageEnum)
}>()

const props = withDefaults(defineProps<{
  name: string
  value?: CodeLanguageEnum
  options: Array<{type:string, name:string}> //EnvironmentSetupFragment['languages']
  disabled?: boolean
}>(), {
  disabled: false,
  value: undefined,
})

const isOpen = ref(false)

const selectedOptionObject = computed(() => {
  return props.options.find((opt) => opt.type === props.value)
})

const selectOption = (opt: CodeLanguageEnum) => {
  emit('select', opt)
}

</script>
