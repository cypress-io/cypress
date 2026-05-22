import { ensureSignedBundle } from '../bundles/ensure_signed_bundle'

interface EnsureCyPromptBundleOptions {
  cyPromptUrl: string
  projectId?: string
}

interface EnsureCyPromptBundleResult {
  manifest: Record<string, string>
  cyPromptPath: string
}

export const ensureCyPromptBundle = async ({
  cyPromptUrl,
  projectId,
}: EnsureCyPromptBundleOptions): Promise<EnsureCyPromptBundleResult> => {
  const { manifest, bundleDir } = await ensureSignedBundle({
    url: cyPromptUrl,
    projectId,
    kind: 'cy-prompt',
  })

  return {
    manifest,
    cyPromptPath: bundleDir,
  }
}
