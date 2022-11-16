<script lang="ts" setup>
import {
  deriveSpecTree,
  fuzzySortSpecs,
  getAllFileInDirectory,
} from "./tree/deriveTree";
import type { SpecListOptions, SpecTreeDirectoryNode } from "./tree/deriveTree";
import type { ProjectConnectionStatus} from './tree/types'
import type {
  SpecsListFragment,
  Specs_SpecsListFragment,
} from "../generated/graphql";
import { computed, reactive, ref } from "vue";
import SpecsListDirectory from "./SpecsList/SpecsListDirectory.vue";
import { getPlatform } from "./tree/useCollapsibleTree";
import SpecsListHeader from "./SpecsListHeader.vue";
import SpecsListTableHeader from "./SpecsList/SpecsListTableHeader.vue";
import { useSpecFilter } from "../composables/useSpecFilter";
import NoResults from "@cy/components/NoResults.vue";
import { useI18n } from "@cy/i18n";

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

const projectConnectionStatus = computed<ProjectConnectionStatus>(() => {
  if (!props.gql.cloudViewer) return "LOGGED_OUT";

  if (!props.gql.currentProject?.cloudProject?.__typename)
    return "NOT_CONNECTED";

  if (
    props.gql.currentProject?.cloudProject?.__typename ===
    "CloudProjectNotFound"
  )
    return "NOT_FOUND";

  if (
    props.gql.currentProject?.cloudProject?.__typename ===
    "CloudProjectUnauthorized"
  ) {
    if (props.gql.currentProject?.cloudProject?.hasRequestedAccess) {
      return "ACCESS_REQUESTED";
    }

    return "UNAUTHORIZED";
  }

  return "CONNECTED";
});

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

const { t } = useI18n();
// result count is always count of files from root node
const resultCount = computed(
  () => getAllFileInDirectory(tree.value.root).length
);
</script>

<template>
  <SpecsListHeader
    v-model="specFilterModel"
    :specs-list-input-ref-fn="specsListInputRefFn"
    class="pb-32px"
    :result-count="resultCount"
    :spec-count="specs.length"
  />
  <SpecsListTableHeader v-if="specs.length" :gql="props.gql" />
  <!-- @show-create-spec-modal="emit('showCreateSpecModal')"
    @show-spec-pattern-modal="showSpecPatternModal = true" -->
  <div
    class="divide-y-1 border-gray-50 border-y-1 children:border-gray-50 children:h-40px"
  >
    <SpecsListDirectory
      :node="tree.root"
      :onHandleCollapse="handleCollapse"
      :project-connection-status="projectConnectionStatus"
    />
  </div>
  <NoResults
    v-show="!specs.length"
    :search-term="specFilterModel"
    :message="t('specPage.noResultsMessage')"
    class="mt-56px"
    @clear="handleClear"
  />
</template>
