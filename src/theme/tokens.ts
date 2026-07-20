import { Platform } from 'react-native';

export const colors = {
  salmon: '#F47661',
  lacquerRed: '#D94B45',
  counterOrange: '#F3A65A',
  rice: '#FFF8E8',
  riceDeep: '#FFF0D1',
  surface: '#FFFFFF',
  tamago: '#F9CB5C',
  tamagoShadow: '#D29A34',
  nori: '#315447',
  noriShadow: '#203C33',
  soy: '#402A26',
  soyDeep: '#2A1C1A',
  mutedSoy: '#76554D',
  blush: '#F5B2A2',
  success: '#517661',
  overlay: 'rgba(64, 42, 38, 0.58)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  control: 12,
  card: 16,
  sheet: 24,
} as const;

export const typography = {
  display: 'Pixelify',
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'system-ui' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' }),
} as const;

export const layout = {
  maxPhoneWidth: 560,
  minTouch: Platform.OS === 'ios' ? 44 : 48,
  shadowOffset: 6,
} as const;

export const motion = {
  instant: 90,
  feedback: 180,
  state: 280,
  celebration: 480,
} as const;
