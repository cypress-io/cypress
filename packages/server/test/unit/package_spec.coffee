## TODO:
## refactor this to work with new electron settings
# require("../spec_helper")

# cp =   require("child_process")
# pkg  = require("#{root}package")

# describe "lib/package", ->
#   it "includes mocha as dependency", ->
#     expect(pkg.dependencies).to.include.keys("mocha")

#   context "window", ->
#     it "has osx configuration by default", ->
#       expect(pkg.window).to.deep.eq({
#         icon: "nw/public/img/cypress.iconset/icon_256x256@2x.png"
#         title: "Cypress"
#         frame: false
#         toolbar: false
#         show: false
#         show_in_taskbar: false
#         height: 400
#         width: 300
#       })

#     it "resolves icon", ->
#       fs.statAsync(pkg.window.icon)

#   context "platformOverrides", ->
#     it "has linux overrides", ->
#       expect(pkg.platformOverrides.linux.window).to.deep.eq({
#         frame: true
#         show: true
#         show_in_taskbar: true
#       })
