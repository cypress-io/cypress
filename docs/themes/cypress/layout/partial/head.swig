<head prefix="og: http://ogp.me/ns#">
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{{ description(page, config.description) }}" />

  <title>{{ config.title }} | {% if page.title %}{{ page.title }}{% else %}{{ config.subtitle }}{% endif %}</title>

  <!-- Canonical links -->
  <link rel="canonical" href="{{ url }}">
  <!-- Alternative links -->
  {% if page.layout == 'page' or page.layout == 'index' %}
    {% for lang in site.data.languages %}
      <link rel="alternative" hreflang="{{ loop.key }}" href="{{ canonical_url(loop.key) }}">
    {% endfor %}
  {% endif %}
  <!-- Icon -->
  <link rel="icon" type="image/x-icon" href="/img/favicon.ico" sizes="16x16" />

  <link href="https://fonts.googleapis.com/css?family=Fira+Sans:300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">

  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">

  <!-- CSS -->
  <!-- build:css /css/style.css -->
  {{ css('css/docsearch') }}
  {{ css('css/cypress') }}
  <!-- endbuild -->

  <!-- Open Graph http://ogp.me/ -->
  {{ open_graph({
    type: website,
    fb_admins: config.facebook_admin_id,
    fb_app_id: config.facebook_app_id,
    twitter_id: config.twitter_username,
    twitter_site: config.twitter_username
  }) }}

  <!-- Google Analytics, Tag Manager, and Optimize -->
  {{ partial('google-plugins') }}
</head>
