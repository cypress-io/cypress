<article class="article post" itemscope itemtype="http://schema.org/Article">
  <header class="article-header">
    {% if is_post() %}
      <h1 class="article-title" itemprop="name">{{ post.title }}</h1>
    {% else %}
      <h1>
        <a href="{{ url_for(post.path) }}" class="article-title" itemprop="name">{{ post.title }}</a>
      </h1>
    {% endif %}
    <a href="{{ url_for(post.path) }}" class="article-date">{{ time_tag(post.date) }}</a>
  </header>
  <div class="article-content" itemprop="articleBody">
    {{ page_anchor(post.content) }}
  </div>
  {{ partial('partial/comment') }}
</article>
