<template>
  <div class="rounded flex font-medium bg-gray-900 py-2px px-12px text-gray-200 text-14px leading-20px gap-8px items-center">
    <label
      class="hidden"
      for="toggle-highlights"
    >{{ t('runner.snapshot.toggleHighlights') }}</label>
    <Switch
      name="toggle-highlights"
      :value="toggleHighlights"
      size="sm"
      @update="toggleHighlights = !toggleHighlights"
    />
    {{ t('runner.snapshot.highlightsLabel') }}
  </div>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue'
import Switch from '@cy/components/Switch.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  value?: boolean
}>(), { value: false })

const emits = defineEmits<{
  (e: 'update:value', value: boolean): void
}>()

const toggleHighlights = ref(props.value)

watch(toggleHighlights, (val) => {
  emits('update:value', val)
})
</script>
