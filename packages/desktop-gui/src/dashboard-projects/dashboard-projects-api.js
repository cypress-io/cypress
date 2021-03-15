import ipc from '../lib/ipc'
import dashboardProjectsStore from './dashboard-projects-store'

let pollId

const getDashboardProjects = () => {
  ipc.getDashboardProjects().then((projects = []) => {
    dashboardProjectsStore.setProjects(projects)

    return null
  }).catch(ipc.isUnauthed, ipc.handleUnauthed)
  .catch((err) => {
    dashboardProjectsStore.setError(err)

    return null
  })

  return null
}

const isPolling = () => {
  return !!pollId
}

const pollDashboardProjects = () => {
  if (pollId) return

  pollId = setInterval(() => {
    getDashboardProjects()
  }, 10000)
}

const stopPollingDashboardProjects = () => {
  clearInterval(pollId)
  pollId = null
}

const setupDashboardProject = (projectDetails) => {
  return ipc.setupDashboardProject(projectDetails)
  .then((project) => {
    dashboardProjectsStore.addProject(project)

    return project
  })
  .catch(ipc.isUnauthed, ipc.handleUnauthed)
}

const setProjectId = (id) => {
  return ipc.setProjectId(id)
}

export default {
  getDashboardProjects,
  isPolling,
  pollDashboardProjects,
  stopPollingDashboardProjects,
  setupDashboardProject,
  setProjectId,
}
