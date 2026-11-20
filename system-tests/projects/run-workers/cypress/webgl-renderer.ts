export const webglRenderer = () => {
  const gl = document.createElement('canvas').getContext('webgl')

  if (!gl) {
    return 'no WebGL'
  }

  const info = gl.getExtension('WEBGL_debug_renderer_info')

  return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
}
