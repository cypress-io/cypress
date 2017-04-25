<!-- Scripts -->
<!-- build:js build/js/main.js -->
{{ js('js/lang_select') }}
{{ js('js/scrollingelement') }}
{{ js('js/menuspy') }}
{{ js('js/toc') }}
{{ js('js/mobile_nav') }}
<!-- endbuild -->
<script src="https://cdn.jsdelivr.net/retinajs/1.3.0/retina.min.js" async></script>

<!-- Algolia -->
{% if config.algolia[page.lang] %}
  <script type="text/javascript" src="https://cdn.jsdelivr.net/docsearch.js/1/docsearch.min.js"></script>
  <script type="text/javascript">
    document.getElementById('search-input-wrap').classList.add('on');
    docsearch({
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
{% endif %}
