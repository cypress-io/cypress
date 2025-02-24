declare module 'components/StudioPanel' {
  export const StudioPanel: () => JSX.Element
}
declare module 'app-studio' {
  import { StudioPanel } from 'components/StudioPanel'
  export default StudioPanel
}
