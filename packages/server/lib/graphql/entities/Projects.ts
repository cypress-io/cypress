import { objectType, extendType, stringArg, nonNull, nullable, enumType } from 'nexus'
import { ProjectBase } from '../../project-base'
import { projects, TestingType } from '../../projects'

const PluginsState = enumType({
  name: 'PluginsState',
  members: ['uninitialized', 'initializing', 'initialized', 'error'],
})

const InitPluginsStatus = objectType({
  name: 'InitPluginsStatus',
  definition (t) {
    t.field('state', {
      type: PluginsState,
    }),
    t.nullable.string('message')
  },
})

export const Project = objectType({
  name: 'Project',
  definition (t) {
    t.string('projectRoot')
    t.boolean('isOpen')
    t.field('plugins', {
      type: InitPluginsStatus,
    })
  },
})

function formatProject (project: ProjectBase<any>) {
  return {
    projectRoot: project.projectRoot,
    isOpen: project.isOpen,
    plugins: project.pluginsStatus,
  }
}

export const Projects = extendType({
  type: 'Query',
  definition (t) {
    t.nonNull.list.field('projects', {
      type: 'Project',
      resolve (_root, args, ctx) {
        return Object.values(projects.projects).map(formatProject)
      },
    })
  },
})

export const OpenProject = extendType({
  type: 'Query',
  definition (t) {
    t.nullable.field('openProject', {
      type: nullable('Project'),
      resolve (_root, args, ctx) {
        try {
          return formatProject(projects.openProject)
        } catch (e) {
          return null
        }
      },
    })
  },
})

export const InitializePlugins = extendType({
  type: 'Mutation',
  definition (t) {
    t.nonNull.field('initializePlugins', {
      type: InitPluginsStatus,
      async resolve (_root, args, ctx) {
        await projects.initializePlugins()

        return projects.openProject.pluginsStatus
      },
    })
  },
})

export const AddProject = extendType({
  type: 'Mutation',
  definition (t) {
    t.nonNull.field('addProject', {
      type: nullable('Boolean'),
      args: {
        projectRoot: nonNull(stringArg()),
        testingType: nonNull(stringArg()),
      },
      async resolve (_root, args, ctx) {
        await projects.addProject({
          projectRoot: args.projectRoot,
          testingType: args.testingType as TestingType,
        }, {
          isCurrentProject: true,
        })

        return true
      },
    })
  },
})
