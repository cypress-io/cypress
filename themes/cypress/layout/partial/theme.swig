<li class="plugin on">
  <div class="plugin-screenshot">
    <img src="{{ url_for('themes/screenshots/' + plugin.name + '.png') }}" class="plugin-screenshot-img">
    {% if plugin.preview %}
    <a href="{{ plugin.preview }}" class="plugin-preview-link" target="_blank"><i class="fa fa-eye"></i></a>
    {% endif %}
  </div>
  <a href="{{ plugin.link }}" class="plugin-name" target="_blank">{{ plugin.name }}</a>
  <p class="plugin-desc">{{ plugin.description }}</p>
  <div class="plugin-tag-list">
    {% for tag in plugin.tags %}
      <a href="#{{ tag }}" class="plugin-tag">{{ tag }}</a>
    {% endfor %}
  </div>
</li>