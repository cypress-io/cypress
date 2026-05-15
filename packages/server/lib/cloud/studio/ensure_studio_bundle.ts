import { ensureSignedBundle } from '../bundles/ensure_signed_bundle'

interface EnsureStudioBundleOptions {
  studioUrl: string
  projectId?: string
}

interface EnsureStudioBundleResult {
  manifest: Record<string, string>
  studioPath: string
}

export const ensureStudioBundle = async ({
  studioUrl,
  projectId,
}: EnsureStudioBundleOptions): Promise<EnsureStudioBundleResult> => {
  const { manifest, bundleDir } = await ensureSignedBundle({
    url: studioUrl,
    projectId,
    kind: 'studio',
  })

  return {
    manifest,
    studioPath: bundleDir,
  }
}
