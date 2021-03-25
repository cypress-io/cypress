export type Styles = {
  "space-2xl": string;
  "space-3xl": string;
  "space-4xl": string;
  "space-l": string;
  "space-m": string;
  "space-ml": string;
  "space-ms": string;
  "space-s": string;
  "space-xl": string;
  "space-xs": string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
