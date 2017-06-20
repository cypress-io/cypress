<!DOCTYPE html>
<html lang="{{ page.lang }}">
{{ partial('partial/head') }}
<body>
  <script type="text/javascript">
    window.env = window.Cypress ? 'test' : '{{env.NODE_ENV}}'
  </script>
  {{ partial('partial/google-tag-manager-noscript')}}
  <div id="container">
    {{ partial('partial/header') }}
    {{ body }}
    {{ partial('partial/footer') }}
  </div>
  <div id="mobile-nav-dimmer"></div>
  {{ partial('partial/mobile_nav') }}
  {{ partial('partial/after_footer') }}
</body>
</html>
