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
    borderRadius: 10,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

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
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
    boxShadowSecondary: '0 8px 32px rgba(0,0,0,0.55), 0 0 20px rgba(181,136,99,0.12)',
  },
  components: {
    Button: {
      primaryColor: '#10232A',         // Text trên nút gold
      borderRadius: 9999,              // Pill button chuẩn ảnh twinkle
      borderRadiusLG: 9999,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: 'rgba(61, 77, 85, 0.7)',
      borderRadiusLG: 18,
    },
    Table: {
      colorBgContainer: 'rgba(61, 77, 85, 0.4)',
      headerBg: 'rgba(16, 35, 42, 0.85)',
      rowHoverBg: 'rgba(181, 136, 99, 0.1)',
    },
    Input: {
      colorBgContainer: 'rgba(16, 35, 42, 0.7)',
      activeBorderColor: '#B58863',
      hoverBorderColor: '#D4A574',
      borderRadius: 9999,              // Pill input chuẩn ảnh twinkle
      borderRadiusLG: 9999,
    },
    Modal: {
      contentBg: '#2A383F',
      headerBg: '#2A383F',
      borderRadiusLG: 20,
    },
    Tag: {
      borderRadiusSM: 9999,            // Pill tags
    },
    Segmented: {
      itemSelectedBg: '#B58863',
      itemSelectedColor: '#10232A',
      trackBg: 'rgba(16, 35, 42, 0.65)',
      borderRadius: 9999,
    },
    Menu: {
      darkItemBg: '#10232A',
      darkItemSelectedBg: 'rgba(181, 136, 99, 0.18)',
      darkItemSelectedColor: '#B58863',
    },
  },
};
