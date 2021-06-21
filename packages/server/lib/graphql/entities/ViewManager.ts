import { nxs } from 'nexus-decorators'

export const AllViews = nxs.Nexus.enumType({
  name: 'AllViews',
  members: [
    'INTRO',
    'PROJECT_SPECS',
    'PROJECT_RUNS',
    'PROJECT_SETTINGS',
  ],
})

@nxs.objectType()
export class ViewManager {
  @nxs.field.nonNull.type(() => AllViews)
  currentView () {
    //
  }

  @nxs.field.list.type(() => ViewManagerLink)
  links () {
    //
  }
}

export class ViewManagerLink {
  //
}
