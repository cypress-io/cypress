React = require("react")

module.exports = React.createClass({
  render: ->
    <div id="tests-list-page">
      <ul className="outer-files-container list-as-table">
        <li className="folder">
          <div>
            <div>
              <i className="fa fa-folder-open-o"></i>
              Integration{" "}
            </div>
            <div>
              <ul className="list-as-table">
                <li className="file">
                  <div>
                    <div>
                      <i className="fa fa-file-o"></i>
                      Baz.coffee
                    </div>
                  </div>
                  <div>
                    <div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </li>
      </ul>
    </div>
})