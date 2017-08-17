<script type="text/javascript">
  document.getElementById('search-input-wrap').classList.add('on');
  docsearch({
    appId: '{{ config.algolia[page.lang].app_id }}',
    apiKey: '{{ config.algolia[page.lang].api_key }}',
    indexName: '{{ config.algolia[page.lang].index_name }}',
    inputSelector: '#search-input',
    algoliaOptions: {
      // See https://www.algolia.com/doc/api-client/javascript/parameters/#overview
      // For full list of options
    },
    autocompleteOptions: {
      // See https://github.com/algolia/autocomplete.js#options
      // For full list of options
    }
  });
</script>
