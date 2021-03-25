export type Styles = {
  "text-2xl": string;
  "text-3xl": string;
  "text-4xl": string;
  "text-l": string;
  "text-m": string;
  "text-ml": string;
  "text-mono-m": string;
  "text-mono-s": string;
  "text-ms": string;
  "text-s": string;
  "text-xl": string;
  "text-xs": string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
