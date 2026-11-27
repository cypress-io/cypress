import { ensureSignedBundle } from '../bundles/ensure_signed_bundle'

interface EnsureCyPromptBundleOptions {
  cyPromptUrl: string
}

interface EnsureCyPromptBundleResult {
  manifest: Record<string, string>
  cyPromptPath: string
}

export const ensureCyPromptBundle = async ({
  cyPromptUrl,
}: EnsureCyPromptBundleOptions): Promise<EnsureCyPromptBundleResult> => {
  const { manifest, bundleDir } = await ensureSignedBundle({
    url: cyPromptUrl,
    kind: 'cy-prompt',
  })

  return {
    manifest,
    cyPromptPath: bundleDir,
  }
}
