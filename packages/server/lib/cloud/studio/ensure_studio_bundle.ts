import { ensureSignedBundle } from '../bundles/ensure_signed_bundle'

interface EnsureStudioBundleOptions {
  studioUrl: string
}

interface EnsureStudioBundleResult {
  manifest: Record<string, string>
  studioPath: string
}

export const ensureStudioBundle = async ({
  studioUrl,
}: EnsureStudioBundleOptions): Promise<EnsureStudioBundleResult> => {
  const { manifest, bundleDir } = await ensureSignedBundle({
    url: studioUrl,
    kind: 'studio',
  })

  return {
    manifest,
    studioPath: bundleDir,
  }
}
