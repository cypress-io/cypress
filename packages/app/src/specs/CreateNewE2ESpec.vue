<template>
    <CreateSpecCard
    :icon="BoxOpenIcon"
    :header="t('createSpec.e2e.importFromScaffold.header')"
    :description="t('createSpec.e2e.importFromScaffold.description')"/>
    <CreateSpecCard
    :icon="DocumentCodeIcon"
    :header="t('createSpec.e2e.importEmptySpec.header')"
    :description="t('createSpec.e2e.importEmptySpec.description')"/>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import CreateSpecCard from './CreateSpecCard.vue'
import BoxOpenIcon from '~icons/cy/box-open_x48'
import DocumentCodeIcon from '~icons/cy/document-code_x48'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
</script>