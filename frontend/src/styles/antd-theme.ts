import type { ThemeConfig } from 'antd';

export const cyberLuxTheme: ThemeConfig = {
  token: {
    // === Colors ===
    colorPrimary: '#B58863',           // --gold
    colorBgBase: '#10232A',            // --midnight
    colorBgContainer: '#3D4D55',       // --slate (card, input, table)
    colorBgElevated: '#3D4D55',        // --slate (modal, dropdown)
    colorBgLayout: '#10232A',          // --midnight
    colorText: '#D3C3B9',             // --sand
    colorTextSecondary: '#A79E9C',     // --mist
    colorTextPlaceholder: 'rgba(167, 158, 156, 0.5)', // --mist 50%
    colorBorder: 'rgba(167, 158, 156, 0.2)',  // --mist 20%
    colorBorderSecondary: 'rgba(167, 158, 156, 0.1)',
    colorLink: '#B58863',
    colorLinkHover: '#D4A574',         // --gold-light
    colorSuccess: '#4CAF50',
    colorWarning: '#FFB74D',
    colorError: '#EF5350',
    colorInfo: '#5B8FA8',

    // === Shape ===
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // === Typography ===
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,

    // === Spacing ===
    padding: 16,
    paddingLG: 24,
    margin: 16,

    // === Effects ===
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    boxShadowSecondary: '0 4px 24px rgba(181, 136, 99, 0.08)',
  },
  components: {
    Button: {
      primaryColor: '#10232A',         // Text trên nút gold
      borderRadiusLG: 10,
    },
    Card: {
      colorBgContainer: 'rgba(61, 77, 85, 0.6)',
      borderRadiusLG: 12,
    },
    Table: {
      colorBgContainer: 'rgba(61, 77, 85, 0.4)',
      headerBg: 'rgba(16, 35, 42, 0.8)',
      rowHoverBg: 'rgba(181, 136, 99, 0.08)',
    },
    Input: {
      colorBgContainer: 'rgba(16, 35, 42, 0.6)',
      activeBorderColor: '#B58863',
      hoverBorderColor: '#D4A574',
    },
    Modal: {
      contentBg: '#3D4D55',
      headerBg: '#3D4D55',
    },
    Menu: {
      darkItemBg: '#10232A',
      darkItemSelectedBg: 'rgba(181, 136, 99, 0.15)',
      darkItemSelectedColor: '#B58863',
    },
  },
};
