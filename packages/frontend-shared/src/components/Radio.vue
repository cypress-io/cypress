<template>
  <label
    class="mt-[24px] text-gray-800 block font-bold"
    :for="props.name"
  >{{ props.label }}</label>
  <div
    v-for="opt in options"
    :key="opt.value"
    class="mt-[8px]"
  >
    <label
      class="flex text-[16px] leading-[24px] items-center"
    >
      <input
        type="radio"
        :name="props.name"
        :value="opt.value"
        class="mr-[8px] radio hocus-default checked:bg-transparent checked:hocus:bg-transparent checked:border-indigo-500 checked:hocus:border-indigo-500"
        :checked="props.value === opt.value"
        @click="emits('update:value', opt.value)"
      >
      <slot
        name="option"
        :option="opt"
        :checked="props.value === opt.value"
      >
        <span class="text-gray-800">{{ opt.label }}</span>
        <span class="text-gray-500"> - {{ opt.description }}</span>
      </slot>
    </label>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  name: string
  label: string
  value?: string
  options: Array<{
    label: string
    value: string
    description?: string
  }>
}>()

const emits = defineEmits<{
  (event: 'update:value', value: string): void
}>()
</script>

<style lang="scss" scoped>
.radio::before {
  content: "";
  @apply block w-[6px] h-[6px] m-[4px] rounded-full bg-indigo-500 transition-transform transform scale-0
}
.radio:checked::before {
  @apply scale-100
}
</style>
