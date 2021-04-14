export type Styles = {
  "depth-3": string;
  "depth-4": string;
  "depth-6": string;
  "depth-bordered": string;
  "depth-flat": string;
  "depth-float": string;
  "depth-inset-slight": string;
  "depth-inset-well": string;
  "depth-slight": string;
  "shadow-3": string;
  "shadow-4": string;
  "shadow-6": string;
  "shadow-bordered": string;
  "shadow-flat": string;
  "shadow-float": string;
  "shadow-inset-slight": string;
  "shadow-inset-well": string;
  "shadow-slight": string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
