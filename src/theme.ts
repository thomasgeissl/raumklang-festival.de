import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ff8a3d', contrastText: '#1a0d05' },
    secondary: { main: '#ffc27a' },
    background: { default: '#0c0806', paper: '#1a120d' },
    text: { primary: '#fcf6f0', secondary: 'rgba(252, 246, 240, 0.68)' },
  },
  shape: { borderRadius: 999 },
  typography: {
    fontFamily: '"Manrope", system-ui, sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '0.18em',
      lineHeight: 1,
    },
    h2: { fontFamily: '"Space Grotesk", "Manrope", sans-serif', fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': { height: '100%', margin: 0, overflow: 'hidden' },
        body: { backgroundColor: '#0c0806', overscrollBehavior: 'none' },
      },
    },
  },
});
