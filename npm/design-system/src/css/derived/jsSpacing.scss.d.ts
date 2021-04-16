export type Styles = {
  "padding-2xl": string;
  "padding-3xl": string;
  "padding-4xl": string;
  "padding-l": string;
  "padding-m": string;
  "padding-ml": string;
  "padding-ms": string;
  "padding-s": string;
  "padding-xl": string;
  "padding-xs": string;
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
