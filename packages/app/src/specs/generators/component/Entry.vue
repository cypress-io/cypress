<template>
  <StandardModalBody>
    Body
  </StandardModalBody>
  <StandardModalFooter>
    <Button>Hello!</Button>
  </StandardModalFooter>
</template>

<script setup lang="ts">
import { useVModels } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import StandardModalBody from '@cy/components/StandardModalBody.vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import Button from '@cy/components/Button.vue'

const props = defineProps<{
  title: string,
  description: string
}>()

const { t } = useI18n()

const emits = defineEmits<{
  (event: 'update:title', value: string): void,
  (event: 'update:description', value: string): void
}>()

const { title } = useVModels(props, emits)
title.value = t('createSpec.component.importFromComponent.chooseAComponentHeader')
</script>
