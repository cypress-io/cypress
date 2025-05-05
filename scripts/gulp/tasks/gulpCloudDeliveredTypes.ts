process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV ?? 'production'

import path from 'path'
import fs from 'fs-extra'
import { retrieveAndExtractStudioBundle, studioPath } from '@packages/server/lib/cloud/api/studio/get_and_initialize_studio_manager'
import { postStudioSession } from '@packages/server/lib/cloud/api/studio/post_studio_session'

export const downloadStudioTypes = async (): Promise<void> => {
  const studioSession = await postStudioSession({ projectId: 'ypt4pf' })

  await retrieveAndExtractStudioBundle({ studioUrl: studioSession.studioUrl, projectId: 'ypt4pf' })

  await fs.copyFile(
    path.join(studioPath, 'app', 'types.ts'),
    path.join(__dirname, '..', '..', '..', 'packages', 'app', 'src', 'studio', 'studio-app-types.ts'),
  )

  await fs.copyFile(
    path.join(studioPath, 'server', 'types.ts'),
    path.join(__dirname, '..', '..', '..', 'packages', 'types', 'src', 'studio', 'studio-server-types.ts'),
  )
}
