<template>
Create from Component
  <StandardModalBody>
    <FileMatch/>
  </StandardModalBody>
  <StandardModalFooter>
    <Button @click="$emit('restart')">Hello!</Button>
  </StandardModalFooter>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import StandardModalHeader from '@cy/components/StandardModalHeader.vue'
import StandardModalBody from '@cy/components/StandardModalBody.vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'
import FileMatch from '../../../components/FileMatch.vue'
import { onBeforeUnmount } from 'vue'

const props = defineProps<{
  title?: string,
  description?: string  
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
}>()

const { title } = useVModels(props, emits)
title.value = t('createSpec.component.importFromComponent.chooseAComponentHeader')

// onBeforeUnmount(() => {
//   title.value = ''
// })
</script>
