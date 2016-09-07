module.exports = {
  partial: (domain) ->
    "
      <script type='text/javascript'>
        document.domain = '#{domain}';
      </script>
    "

  full: (domain) ->
    "
      <script type='text/javascript'>
        document.domain = '#{domain}';
        window.onerror = function(){
          parent.onerror.apply(parent, arguments);
        }
      </script>
      <script type='text/javascript' src='/__cypress/static/js/sinon.js'></script>
      <script type='text/javascript'>
        var Cypress = parent.Cypress;
        if (!Cypress){
          throw new Error('Cypress must exist in the parent window!');
        };
        Cypress.onBeforeLoad(window);
      </script>
    "

}