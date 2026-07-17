export const darkColours = {
  bg:          '#0f0f13',
  surface:     '#1a1a1f',
  border:      '#2a2a2f',
  borderLight: '#fff',

  accent:      '#6366f1',
  accentBg:    'rgba(99,102,241,0.15)',

  success:     '#4caf7d',
  error:       '#e05858',
  inactive:    '#444',

  text:        '#f0f0f0',
  textDim:     '#d0d0d0',
  textMuted:   '#888',
  textFaint:   '#666',
  textGhost:   '#555',
};

export const lightColours = {
  bg:          '#f7f7fa',
  surface:     '#ffffff',
  border:      '#e2e2e8',
  borderLight: '#fff',

  accent:      '#6366f1',
  accentBg:    'rgba(99,102,241,0.10)',

  success:     '#2f9d63',
  error:       '#d64545',
  inactive:    '#c4c4cc',

  text:        '#16161d',
  textDim:     '#3a3a42',
  textMuted:   '#63636b',
  textFaint:   '#87878f',
  textGhost:   '#9a9aa2',
};


export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
};

export const radius = {
  sm: 6, md: 8, lg: 10, xl: 12,
};

export const typography = {
  title:    { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '400' as const },
  section:  { fontSize: 10, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 1.5 },
  body:     { fontSize: 14, fontWeight: '400' as const },
  small:    { fontSize: 11, fontWeight: '500' as const },
};

export type Colours = typeof darkColours;