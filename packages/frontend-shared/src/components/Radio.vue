<template>
  <label
    class="text-gray-800 mt-24px block"
    :for="props.name"
  >{{ props.label }}</label>
  <div
    v-for="opt in options"
    :key="opt.value"
    class="mt-8px"
  >
    <label
      class="flex items-center text-16px leading-24px"
    >
      <input
        type="radio"
        :name="props.name"
        :value="opt.value"
        class="radio mr-8px hocus-default checked:border-indigo-500 checked:bg-transparent"
        :checked="props.value === opt.value"
        @click="emits('update:value', opt.value)"
      >
      <span class="text-gray-800">{{ opt.label }}</span>
      <span class="text-gray-500"> - {{ opt.description }}</span>
    </label>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  name: string,
  label: string,
  value?: string,
  options: Array<{
    label: string,
    value: string,
    description?: string,
  }>,
}>()

const emits = defineEmits<{
  (event: 'update:value', value: string): void
}>()
</script>

<style lang="scss" scoped>
.radio::before {
  content: "";
  @apply block w-6px h-6px m-4px rounded-full bg-indigo-500 transition-transform transform scale-0
}
.radio:checked::before {
  @apply scale-100
}
</style>
