import { enumType } from 'nexus'

export const EventIdFieldEnum = enumType({
  name: 'EventIdFieldEnum',
  // This may eventually include `logged_in_uid` for users logged in to cloud
  members: ['machine_id'],
})
