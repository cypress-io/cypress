describe "File Entities", ->
  context "#resetToTreeView", ->
    it "transforms a flat collection into nested tree", ->
      files = new App.Entities.FilesCollection [
        {"name":"application/app_spec.coffee"}
        {"name":"apps/accounts/account_new_spec.coffee"}
        {"name":"apps/accounts/accounts_list_spec.coffee"}
        {"name":"apps/admin_users/admin_users_list_spec.coffee"}
      ]

      files.resetToTreeView()

      json = files.toJSON()

      expect(json).to.deep.eq [
        {
          name: "application"
          children: [
            {
              name: "app_spec.coffee"
              fullPath: "application/app_spec.coffee"
              children: []
            }
          ]
        },
        {
          name: "apps"
          children: [
            {
              name: "accounts"
              children: [
                {
                  name: "account_new_spec.coffee"
                  fullPath: "apps/accounts/account_new_spec.coffee"
                  children: []
                },
                {
                  name: "accounts_list_spec.coffee"
                  fullPath: "apps/accounts/accounts_list_spec.coffee"
                  children: []
                }
              ]
            },
            {
              name: "admin_users"
              children: [
                {
                  name: "admin_users_list_spec.coffee"
                  fullPath: "apps/admin_users/admin_users_list_spec.coffee"
                  children: []
                }
              ]
            }
          ]
        }
      ]
