import { inputObjectType, nonNull, mutationField, queryField } from 'nexus'
import { projects } from '../../projects'
import { Project, TestingType } from './types'
import { formatProject } from '../utils'

const AddProjectInput = inputObjectType({
  name: 'AddProjectInput',
  definition (t) {
    t.nonNull.string('projectRoot')
    t.nonNull.field('testingType', {
      type: TestingType,
    })

    t.nonNull.boolean('isCurrent')
  },
})

export const allProjects = queryField((t) => {
  t.nonNull.list.field('projects', {
    type: Project,
    resolve (_root, args, ctx) {
      return Object.values(projects.projects).map(formatProject)
    },
  })
})

export const openProject = queryField((t) => {
  t.field('openProject', {
    type: Project,
    resolve (_root, args, ctx) {
      return projects.openProject ? formatProject(projects.openProject) : null
    },
  })
})

export const InitializePlugins = mutationField((t) => {
  t.nonNull.field('initializePlugins', {
    type: Project,
    async resolve (_root, args, ctx) {
      // TODO: should we await here, or return a pending state to the client?
      await projects.initializePlugins()

      return formatProject(projects.openProject!)
    },
  })
})

export const InitializeServer = mutationField((t) => {
  t.nonNull.field('initializeServer', {
    type: Project,
    async resolve (_root, args, ctx) {
      // TODO: should we await here, or return a pending state to the client?
      await projects.initializeServer()

      return formatProject(projects.openProject!)
    },
  })
})

export const AddProject = mutationField((t) => {
  t.nonNull.field('addProject', {
    type: Project,
    args: {
      input: nonNull(AddProjectInput),
    },
    async resolve (_root, args, ctx) {
      const addedProject = await projects.addProject(args.input)

      return formatProject(addedProject)
    },
  })
})
