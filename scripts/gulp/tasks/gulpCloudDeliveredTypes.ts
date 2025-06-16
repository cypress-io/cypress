process.env.CYPRESS_INTERNAL_ENV = process.env.CYPRESS_INTERNAL_ENV ?? 'production'

import path from 'path'
import fs from 'fs-extra'
import { postStudioSession } from '@packages/server/lib/cloud/api/studio/post_studio_session'
import os from 'os'
import { ensureStudioBundle } from '@packages/server/lib/cloud/studio/ensure_studio_bundle'

export const downloadStudioTypes = async (): Promise<void> => {
  if (!process.env.CYPRESS_LOCAL_STUDIO_PATH) {
    const studioSession = await postStudioSession({ projectId: 'ypt4pf' })
    // The studio hash is the last part of the studio URL, after the last slash and before the extension
    const studioHash = studioSession.studioUrl.split('/').pop()?.split('.')[0]
    const studioPath = path.join(os.tmpdir(), 'cypress', 'studio', studioHash)

    await ensureStudioBundle({ studioUrl: studioSession.studioUrl, studioPath, projectId: 'ypt4pf' })

    await fs.copyFile(
      path.join(studioPath, 'app', 'types.ts'),
      path.join(__dirname, '..', '..', '..', 'packages', 'app', 'src', 'studio', 'studio-app-types.ts'),
    )

    await fs.copyFile(
      path.join(studioPath, 'server', 'types.ts'),
      path.join(__dirname, '..', '..', '..', 'packages', 'types', 'src', 'studio', 'studio-server-types.ts'),
    )
  } else {
    await fs.copyFile(
      path.join(process.env.CYPRESS_LOCAL_STUDIO_PATH!, 'app', 'types.ts'),
      path.join(__dirname, '..', '..', '..', 'packages', 'app', 'src', 'studio', 'studio-app-types.ts'),
    )

    await fs.copyFile(
      path.join(process.env.CYPRESS_LOCAL_STUDIO_PATH!, 'server', 'types.ts'),
      path.join(__dirname, '..', '..', '..', 'packages', 'types', 'src', 'studio', 'studio-server-types.ts'),
    )
  }
}
