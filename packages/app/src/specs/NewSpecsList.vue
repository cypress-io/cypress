<script lang="ts" setup>
import { deriveSpecTree, fuzzySortSpecs, getAllFileInDirectory } from "./tree/deriveTree";
import type { SpecListOptions, SpecTreeDirectoryNode } from "./tree/deriveTree";
import type {
  SpecsListFragment,
  Specs_SpecsListFragment,
} from "../generated/graphql";
import { computed, reactive, ref } from "vue";
import SpecsListDirectory from "./SpecsList/SpecsListDirectory.vue";
import { getPlatform } from "./tree/useCollapsibleTree";
import SpecsListHeader from "./SpecsListHeader.vue";
import { useSpecFilter } from "../composables/useSpecFilter";

const props = defineProps<{
  gql: Specs_SpecsListFragment;
}>();

const opts = reactive<SpecListOptions<SpecsListFragment>>({
  sep: "/",
  collapsedDirs: new Set(),
  searchFn: fuzzySortSpecs,
});

const handleCollapse = (node: SpecTreeDirectoryNode<SpecsListFragment>) => {
  const contained = opts.collapsedDirs.has(node.relative);
  if (contained) {
    opts.collapsedDirs = new Set(
      [...opts.collapsedDirs.values()].filter((x) => x !== node.relative)
    );
  } else {
    opts.collapsedDirs = new Set([
      ...opts.collapsedDirs.values(),
      node.relative,
    ]);
  }
};

const specs = computed(() => props.gql.currentProject?.specs.slice() ?? []);

const normalizedSearchValue = (str: string = "") =>
  getPlatform() === "win32" ? str.replaceAll("/", "\\") : str;

const tree = computed(() => {
  return deriveSpecTree(specs.value, {
    ...opts,
    search: normalizedSearchValue(debouncedSpecFilterModel.value),
  });
});

const { debouncedSpecFilterModel, specFilterModel } = useSpecFilter(
  props.gql.currentProject?.savedState?.specFilter
);

const specsListInputRef = ref<HTMLInputElement>();

const specsListInputRefFn = () => specsListInputRef;

function handleClear() {
  specFilterModel.value = "";
  specsListInputRef.value?.focus();
}

// result count is always count of files from root node
const resultCount = computed(() => getAllFileInDirectory(tree.value.root).length);
</script>

<template>
  <SpecsListHeader
    v-model="specFilterModel"
    :specs-list-input-ref-fn="specsListInputRefFn"
    class="pb-32px"
    :result-count="resultCount"
    :spec-count="specs.length"
  />
  <!-- @show-create-spec-modal="emit('showCreateSpecModal')"
    @show-spec-pattern-modal="showSpecPatternModal = true" -->
  <input v-model="opts.search" placeholder="Search..." />
  <div
    class="divide-y-1 border-gray-50 border-y-1 children:border-gray-50 children:h-40px"
  >
    <SpecsListDirectory :node="tree.root" :onHandleCollapse="handleCollapse" />
  </div>
</template>
