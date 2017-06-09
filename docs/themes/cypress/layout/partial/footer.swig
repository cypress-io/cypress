<footer id="footer" class="wrapper">
  <div class="inner">
  <div class="bottom">
    <div class="row">
      <div id="footer-copyright">
        &copy; {{ moment(Date.now()).year() }} {{ config.author }}
      </div>
      <div id="footer-social">
        <ul class="list-unstyled list-inline">
          <li>
            <a class="footer-link" href="https://github.com/{{ config.github_main_repo }}">
              <i class="fa fa-github" title="Github Repo"></i>
            </a>
          </li>
          <li>
            <a class="footer-link" href="https://twitter.com/{{ config.twitter_username }}">
              <i class="fa fa-twitter" title="@{{ config.twitter_username }}"></i>
            </a>
          </li>
          <li>
            <a class="footer-link" href="https://facebook.com/{{ config.facebook_username }}">
              <i class="fa fa-facebook" title="Facebook"></i>
            </a>
          </li>
          <li>
            <a href="mailto:{{ config.email }}">
              <i class="fa fa-envelope" title="Email us"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
  </div>
</footer>
