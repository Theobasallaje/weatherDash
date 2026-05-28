import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#6b7280',
      light: '#9ca3af',
      dark: '#4b5563',
    },

    secondary: {
      main: '#94a3b8',
      light: '#cbd5e1',
      dark: '#64748b',
    },

    background: {
      default: 'rgba(226, 226, 226, 0.08)',
      paper: 'rgba(255, 255, 255, 0.75)',
    },

    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
    },
  },

  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',

    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      color: '#111827',
    },

    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      color: '#111827',
    },

    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#111827',
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'rgba(226, 226, 226, 0.08)',
          backgroundImage: 'none',
          margin: 0,
          padding: 0,
        },

        '#root': {
          minHeight: '100vh',
          backgroundColor: 'rgba(226, 226, 226, 0.08)',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',

          background: 'rgba(255, 255, 255, 0.7)',

          border: '1px solid rgba(255, 255, 255, 0.3)',

          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',

          borderRadius: '20px',

          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

          '&:hover': {
            transform: 'translateY(-4px)',
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)