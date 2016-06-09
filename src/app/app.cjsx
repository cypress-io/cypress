React = require("react")
Nav = require("../nav/nav")
ProjectNav = require("../project-nav/project-nav")
FilesList = require("../files/files-list")
Footer = require("../footer/footer")

module.exports = React.createClass({
  render: ->
    <div>
      <Nav />
      <ProjectNav />
      <FilesList />
      <Footer />
    </div>
})
