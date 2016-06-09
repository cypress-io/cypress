React = require("react")

module.exports = React.createClass({
  render: ->
    <nav className="navbar navbar-inverse">
      <div className="container-fluid">
        <div className="navbar-header dropdown">
          <a className="navbar-brand dropdown-toggle" href="#" data-toggle="dropdown" >
            <i className="fa fa-folder-open"></i>{" "}
            jekyl-blog{" "}
            <span className="caret"></span>
          </a>
          <ul className="dropdown-menu">
            <li>
              <a href="#">
                <i className="fa fa-folder"></i>{" "}
                AdminApp
              </a>
            </li>
            <li role="separator" className="divider"></li>
            <li>
              <a href="#">
                <i className="fa fa-plus"></i>{" "}
                Add Project
              </a>
            </li>
          </ul>
        </div>

        <div className="collapse navbar-collapse">
          <ul className="nav navbar-nav">
            <li>
              <a href="#">
                <i className="fa fa-plus"></i>
              </a>
            </li>
          </ul>
          <ul className="nav navbar-nav navbar-right">
            <li className="dropdown">
              <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                <i className="fa fa-user"></i>{" "}
                Jane Lane{" "}
                <span className="caret"></span>
              </a>
              <ul className="dropdown-menu">
                <li><a href="#">Billing</a></li>
                <li role="separator" className="divider"></li>
                <li><a href="#">Log out</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

})