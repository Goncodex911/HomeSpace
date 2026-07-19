export const colors = {
  background: '#faf9f5',
  surface: '#faf9f5',
  surfaceContainer: '#eeeeea',
  surfaceContainerLow: '#f4f4f0',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant: '#e3e3df',
  primary: '#000000',
  onPrimary: '#ffffff',
  secondary: '#715a3e',
  onSecondary: '#ffffff',
  onSurface: '#1a1c1a',
  onSurfaceVariant: '#444748',
  outline: '#747878',
  outlineVariant: '#c4c7c7',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};

export const spacing = {
  mobile: 20,
  desktop: 48,
};

export const typography = {
  display: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: -1,
    color: colors.onSurface,
  },
  headline: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.onSurface,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  caps: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
};
