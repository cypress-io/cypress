React = require("react")

module.exports = React.createClass({
  render: ->
    <nav className="navbar navbar-default">
      <div className="container-fluid">
        <div className="collapse navbar-collapse">
          <ul className="nav navbar-nav">
            <li>
              <a href="#">
                <i className="fa fa-code"></i>{" "}
                Tests
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa fa-server"></i>{" "}
                Builds
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa fa-cog"></i>{" "}
                Config
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
})