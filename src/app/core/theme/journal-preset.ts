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
      50: '#e8ecf1',
      100: '#c5cdd8',
      200: '#9eadbe',
      300: '#778da9',
      400: '#5a7394',
      500: '#415a77',
      600: '#364b64',
      700: '#2a3b50',
      800: '#1b263b',
      900: '#0d1b2a',
      950: '#071320',
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
          50: '#fafaf8',
          100: '#f5f5f3',
          200: '#e0e1dd',
          300: '#c8c9c5',
          400: '#778da9',
          500: '#415a77',
          600: '#364b64',
          700: '#2a3b50',
          800: '#1b263b',
          900: '#0d1b2a',
          950: '#071320',
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
