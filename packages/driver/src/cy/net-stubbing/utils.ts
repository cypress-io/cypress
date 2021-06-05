export function deepCopyArrayBuffer (originalBuffer: ArrayBuffer): ArrayBuffer {
  const copiedBuffer = new ArrayBuffer(originalBuffer.byteLength)
  const copiedView = new Uint8Array(copiedBuffer)
  const originalView = new Uint8Array(originalBuffer)

  for (let i = 0; i < originalBuffer.byteLength; ++i) {
    copiedView[i] = originalView[i]
  }

  return copiedBuffer
}

export function setArrayBufferPrototype (buffer: ArrayBuffer): void {
  Object.setPrototypeOf(buffer, new ArrayBuffer(0))
}
