declare module 'fake-uuid' {
  type A_to_F = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' 
  const fakeUuid: (input?: A_to_F | number, fill?: number | A_to_F) => string
  export default fakeUuid
}