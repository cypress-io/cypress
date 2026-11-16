<template>
  <div class="rounded flex font-medium bg-gray-900 py-[2px] px-[12px] text-gray-200 text-[14px] leading-[20px] gap-[8px] items-center">
    <Switch
      label-id="toggle-highlights"
      :value="props.value"
      size="sm"
      @update="emits('toggle')"
    />
    <label
      id="toggle-highlights"
      class="cursor-pointer"
    >Highlights
    </label>
  </div>
</template>

<script lang="ts" setup>
import Switch from '@cy/components/Switch.vue'

const props = withDefaults(defineProps<{
  value?: boolean
}>(), { value: true })

const emits = defineEmits<{
  (e: 'toggle'): void
}>()

</script>
