// NOTE: All the colors in this file are also temporarily stored in packages/reporter/src/lib/variables.scss, for use in the reporter. If you change any here, please also change them there.

import Colors from 'windicss/colors'

const customColors = {
  jade: {
    50: '#E4FBF2',
    100: '#C2F1DE',
    200: '#A3E7CB',
    300: '#69D3A7',
    400: '#1FA971',
    500: '#00814D',
    600: '#005F39',
    700: '#00442A',
    800: '#003220',
    900: '#00291B',
    1000: '#00261A',
  },
  red: {
    50: '#FBEFF1',
    100: '#FAD9DF',
    200: '#F8C4CD',
    300: '#F59AA9',
    400: '#E45770',
    500: '#C62B49',
    600: '#9F1331',
    700: '#7A0723',
    800: '#5E021B',
    900: '#4F0018',
    1000: '#490018',
  },
  orange: {
    50: '#F5F4D7',
    100: '#F3ECB3',
    200: '#F1E08F',
    300: '#EDBB4A',
    400: '#DB7903',
    500: '#BD5800',
    600: '#963F00',
    700: '#702C00',
    800: '#521F00',
    900: '#411800',
    1000: '#391500',
  },
  indigo: {
    50: '#F0F1FF',
    100: '#DADDFE',
    200: '#C5C9FD',
    300: '#9AA2FC',
    400: '#6470F3',
    500: '#4956E3',
    600: '#3A46CC',
    700: '#2F3AB0',
    800: '#252E8F',
    900: '#1C236D',
    1000: '#151A50',
  },
  gray: {
    50: '#F3F4FA',
    100: '#E1E3ED',
    200: '#D0D2E0',
    300: '#BFC2D4',
    400: '#AFB3C7',
    500: '#9095AD',
    600: '#747994',
    700: '#5A5F7A',
    800: '#434861',
    900: '#2E3247',
    1000: '#1B1E2E',
  },
  teal: {
    50: '#E0F6FA',
    100: '#B7E7F0',
    200: '#90D9E6',
    300: '#4BBFD2',
    400: '#0097A8',
    500: '#007780',
    600: '#00595D',
    700: '#004143',
    800: '#003131',
    900: '#002828',
    1000: '#002525',
  },
  purple: {
    50: '#F5F0FB',
    100: '#E9DDFA',
    200: '#DECBF8',
    300: '#C8A7F5',
    400: '#A06CE4',
    500: '#7F43C9',
    600: '#632AA6',
    700: '#4B1A83',
    800: '#3B1268',
    900: '#320E58',
    1000: '#2F0C52',
  },
  yellow: {
    50: '#F7F4D2',
    100: '#ECE6A9',
    200: '#E1D984',
    300: '#CBBE41',
    400: '#A18E00',
    500: '#7E6A00',
    600: '#644D00',
    700: '#523800',
    800: '#452900',
    900: '#3D1E00',
    1000: '#391800',
  },
  green: {
    50: '#F5F5D0',
    100: '#E7E8AB',
    200: '#DADC89',
    300: '#BDC44D',
    400: '#849706',
    500: '#5B7100',
    600: '#405500',
    700: '#2E4000',
    800: '#233200',
    900: '#1C2A00',
    1000: '#192500',
  },
  fuchsia: {
    50: '#FAEFFB',
    100: '#F7DAF9',
    200: '#F3C6F8',
    300: '#ED9FF4',
    400: '#D65FE3',
    500: '#B735C7',
    600: '#901CA2',
    700: '#6C0F7E',
    800: '#510862',
    900: '#400651',
    1000: '#39054A',
  },
  magenta: {
    50: '#FCEEF5',
    100: '#FADAEA',
    200: '#F9C5DF',
    300: '#F69ECA',
    400: '#E45DA3',
    500: '#C53282',
    600: '#9C1964',
    700: '#750C4D',
    800: '#59063D',
    900: '#490435',
    1000: '#420333',
  },
}

export const cyColors = {
  ...customColors,
  primary: {
    ...customColors.indigo,
    DEFAULT: customColors.indigo[500],
  },
  secondary: {
    ...customColors.indigo,
    DEFAULT: customColors.indigo[50],
  },
  error: {
    ...customColors.red,
    DEFAULT: customColors.red[400],
  },
  caution: {
    ...customColors.red,
    DEFAULT: customColors.red[500],
  },
  info: {
    ...customColors.indigo,
    DEFAULT: customColors.indigo[500],
  },
  warning: {
    ...customColors.orange,
    DEFAULT: customColors.orange[500],
  },
  'warning-light': {
    ...customColors.orange,
    DEFAULT: customColors.orange[400],
  },
  success: {
    ...customColors.jade,
    DEFAULT: customColors.jade[400],
  },
  'success-light': {
    ...customColors.jade,
    DEFAULT: customColors.jade[300],
  },
  confirm: {
    ...customColors.jade,
    DEFAULT: customColors.jade[500],
  },
  'body-gray': {
    ...customColors.gray,
    DEFAULT: customColors.gray[600],
  },
}

// filter out this deprecated color to remove the annoying warning
const FilteredColors = Object.keys(Colors).reduce((acc, key) => {
  if (key !== 'lightBlue') {
    acc[key] = Colors[key]
  }

  return acc
}, {})

export const colors = { ...FilteredColors, ...cyColors }
