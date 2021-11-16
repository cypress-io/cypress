<template>
  <div
    ref="rootEl"
    class="h-200px overflow-auto"
    tabindex="0"
  >
    <div
      v-for="row, idx in filteredTree"
      :key="idx"
      v-bind="rowProps"
      class="block pt-20px mt-20px"
      :class="{
        'bg-gray-50': row.children,
        'border-2 border-red-500': selectedItem === idx
      }"
      :style="{ marginLeft: `${row.depth * 25}px` }"
      @click="onRowClick(row, idx)"
      @keypress.enter.space.prevent="onRowClick(row, idx)"
    >
      {{ row.name ? `${row.label}: ${row.name}` : row.label }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useCollapsibleTree } from '../../composables/useCollapsibleTree'
import faker from 'faker'
import { Ref, ref, computed } from 'vue'
import { useListNavigation } from '../../composables/useListNavigation'

type ExampleNode = {
  children: ExampleNode[]
  name: string
  id: string
  label: string
}

const contacts: ExampleNode[] = Array.from(new Array(3).keys()).map(() => {
  return {
    name: faker.name.firstName(),
    label: 'Contact Details',
    id: faker.datatype.uuid(),
    children: [
      { id: faker.datatype.uuid(), name: faker.name.jobDescriptor(), label: 'Job Descriptor', children: [] },
      { id: faker.datatype.uuid(), name: faker.name.jobTitle(), label: 'Job Title', children: [] },
      { id: faker.datatype.uuid(), name: faker.company.companyName(), label: 'Company Name', children: [] },
    ],
  }
})

const root: ExampleNode = {
  children: contacts,
  label: 'All Contacts',
  name: '',
  id: faker.datatype.uuid(),
}

const onRowClick = (row, idx) => {
  row.toggle()
  selectedItem.value = idx
}

const rootEl: Ref<HTMLElement | undefined> = ref()

const { tree } = useCollapsibleTree(root)
const filteredTree = computed(() => tree.filter(((item) => !item.hidden.value)))

const { selectedItem, rowProps } = useListNavigation(rootEl)
</script>
