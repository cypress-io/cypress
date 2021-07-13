import { objectType, extendType, stringArg, nonNull } from 'nexus'
import { projects, TestingType } from '../../projects'

export const Project = objectType({
  name: 'Project',
  definition (t) {
    t.int('id')
    t.string('projectRoot')
  }
})

export const Query = extendType({
  type: 'Query',
  definition (t) {
    t.nonNull.list.field('projects', {
      type: Project,
      resolve (_root, args, ctx) {
        return [{ id: 1, projectRoot: 'root' }]
      }
    })
  }
})

const CreateProject = objectType({
  name: 'CreateProject',
  definition (t) {
    t.string('testingType')
    t.string('projectRoot')
  }
})

export const Mutation = extendType({
  type: 'Mutation',
  definition (t) {
    // HOLY CRAP THIS IS VERBOSE IS THIS THE MOST CONCISE WAY TO DO IT??
    t.nonNull.field('addProject', {
      type: CreateProject,
      args: {
        projectRoot: nonNull(stringArg()),
        testingType: nonNull(stringArg()),
      },
      resolve (_root, args, ctx) {
        projects.addProject(args.projectRoot, {
          projectRoot: args.projectRoot,
          // CAN I TYPE THIS USING A CUSTOM SCALAR??
          testingType: args.testingType as TestingType
        })

        return {
          id: 1,
          projectRoot: 'ok',
          testingType: 'asdf'
        } 
      }
    })
  }
})