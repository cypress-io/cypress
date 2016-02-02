@App.module "FilesOnboardingApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "files_onboarding/show/layout"