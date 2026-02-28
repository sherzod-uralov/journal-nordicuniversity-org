import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const JournalPreset = definePreset(Aura, {
  semantic: {
    focusRing: {
      width: '0',
      style: 'none',
      color: 'transparent',
      offset: '0',
    },
    formField: {
      paddingX: '0.875rem',
      paddingY: '0.625rem',
      borderRadius: '{border.radius.md}',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: 'none',
      },
    },
    primary: {
      50: '#edf3fb',
      100: '#d4e3f5',
      200: '#a8c7eb',
      300: '#6da3db',
      400: '#3b7fc5',
      500: '#1e5799',
      600: '#1048a0',
      700: '#0e3d7a',
      800: '#1b3352',
      900: '#0f1c2e',
      950: '#091320',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.800}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.900}',
          activeColor: '{primary.700}',
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.50}',
          filledFocusBackground: '{surface.0}',
          borderColor: '{surface.300}',
          hoverBorderColor: '{surface.400}',
          focusBorderColor: '{primary.500}',
          invalidBorderColor: '#ef4444',
          color: '{surface.900}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{primary.500}',
          floatLabelInvalidColor: '#ef4444',
          iconColor: '{surface.400}',
          shadow: 'none',
        },
        surface: {
          0: '#ffffff',
          50: '#f7f9fc',
          100: '#edf1f6',
          200: '#dde4ee',
          300: '#b8c6d9',
          400: '#7793b3',
          500: '#1e5799',
          600: '#1048a0',
          700: '#0e3d7a',
          800: '#1b3352',
          900: '#0f1c2e',
          950: '#091320',
        },
      },
    },
  },
  components: {
    button: {
      root: { borderRadius: '0.5rem' },
    },
    dialog: {
      root: { borderRadius: '1rem' },
    },
    card: {
      root: { borderRadius: '0.75rem' },
    },
    inputtext: {
      root: {
        borderRadius: '0.5rem',
        transitionDuration: '0.2s',
        shadow: 'none',
      },
    },
    textarea: {
      root: {
        borderRadius: '0.5rem',
        transitionDuration: '0.2s',
        shadow: 'none',
      },
    },
    select: {
      root: {
        borderRadius: '0.5rem',
        transitionDuration: '0.2s',
        shadow: 'none',
      },
    },
    tag: {
      root: { borderRadius: '9999px' },
    },
    paginator: {
      root: { borderRadius: '0.5rem' },
    },
    toast: {
      root: { borderRadius: '0.75rem' },
    },
  },
});
