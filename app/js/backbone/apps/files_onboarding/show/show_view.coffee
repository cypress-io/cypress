@App.module "FilesOnboardingApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "files_onboarding/show/layout"

    triggers:
      "click [data-js='cypress-folder']"  : "cypress:folder:clicked"
      "click [data-js='example-file']"    : "example:file:clicked"
      "click [data-js='fixtures-folder']" : "fixtures:folder:clicked"
      "click [data-js='support-folder']"  : "support:folder:clicked"