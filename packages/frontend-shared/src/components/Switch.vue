<template>
  <button
    :aria-labelledby="labelId"
    class="border-transparent border rounded-[50px] relative hocus-default disabled:ring-0 disabled:outline-0 disabled:bg-gray-100"
    :class="[value ? 'bg-jade-400' : 'bg-gray-300', sizeClasses[size].container, {
      '!hocus:ring-0': size === 'sm'
    }]"
    :disabled="disabled"
    role="switch"
    :aria-checked="value"
    @click="$emit('update', !value)"
  >
    <span
      class="bg-white rounded-[50px] transform transition-transform ease-out duration-200 block toggle"
      :class="[{ [sizeClasses[size].translate]: value }, sizeClasses[size].indicator]"
    />
  </button>
</template>

<script lang="ts" setup>

withDefaults(defineProps<{
  value: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  labelId: string // required for an id so that an external <label> can be associated with the switch
  disabled?: boolean
}>(), {
  value: false,
  size: 'lg',
  disabled: false,
})

const sizeClasses = {
  'sm': {
    container: 'w-[16px] h-[10px]',
    indicator: 'w-[6px] h-[6px] ml-[2px]',
    translate: 'translate-x-[6px]',
  },
  'md': {
    container: 'w-[24px] h-[12px]',
    indicator: 'w-[8px] h-[8px] ml-[2px]',
    translate: 'translate-x-[12px]',
  },
  'lg': {
    container: 'w-[32px] h-[16px]',
    indicator: 'w-[12px] h-[12px] ml-[2px]',
    translate: 'translate-x-[14px]',
  },
  'xl': {
    container: 'w-[48px] h-[24px]',
    indicator: 'w-[16px] h-[16px] ml-[4px]',
    translate: 'translate-x-[24px]',
  },
}

defineEmits<{
  (e: 'update', value: boolean): void
}>()

</script>
