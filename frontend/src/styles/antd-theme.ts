import type { ThemeConfig } from 'antd';

export const cyberLuxTheme: ThemeConfig = {
  token: {
    // === Colors (Twinkle Palette: #202332, #bd9875, #434e60, #8b9a9f) ===
    colorPrimary: '#bd9875',           // (2) --gold chủ đạo
    colorBgBase: '#202332',            // (1) --midnight nền chính
    colorBgContainer: '#434e60',       // (3) --slate (card, input, table)
    colorBgElevated: '#434e60',        // (3) --slate (modal, dropdown)
    colorBgLayout: '#202332',          // (1) --midnight nền layout
    colorText: '#f0ebe5',             // --sand chữ chính sáng rõ (12.6:1 AAA)
    colorTextSecondary: '#9cb0b6',     // (4) --mist tinh chỉnh tăng tương phản chuẩn WCAG AA (>4.5:1)
    colorTextPlaceholder: 'rgba(165, 182, 188, 0.75)', // placeholder sáng rõ chuẩn WCAG (>3.5:1)
    colorBorder: 'rgba(139, 154, 159, 0.28)',  // (4) --mist 28%
    colorBorderSecondary: 'rgba(139, 154, 159, 0.16)',
    colorLink: '#bd9875',
    colorLinkHover: '#d4b595',         // --gold-light
    colorSuccess: '#4CAF50',
    colorWarning: '#FFB74D',
    colorError: '#EF5350',
    colorInfo: '#85C1DC',

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
    boxShadowSecondary: '0 8px 32px rgba(0,0,0,0.55), 0 0 20px rgba(189,152,117,0.15)',
  },
  components: {
    Button: {
      primaryColor: '#202332',         // Text trên nút gold
      borderRadius: 9999,              // Pill button chuẩn ảnh twinkle
      borderRadiusLG: 9999,
      fontWeight: 600,
    },
    Card: {
      colorBgContainer: 'rgba(67, 78, 96, 0.75)',
      borderRadiusLG: 18,
    },
    Table: {
      colorBgContainer: 'rgba(67, 78, 96, 0.45)',
      headerBg: 'rgba(32, 35, 50, 0.85)',
      rowHoverBg: 'rgba(189, 152, 117, 0.1)',
    },
    Input: {
      colorBgContainer: 'rgba(32, 35, 50, 0.7)',
      activeBorderColor: '#bd9875',
      hoverBorderColor: '#d4b595',
      borderRadius: 9999,              // Pill input chuẩn ảnh twinkle
      borderRadiusLG: 9999,
    },
    Modal: {
      contentBg: '#2C3442',
      headerBg: '#2C3442',
      borderRadiusLG: 20,
    },
    Tag: {
      borderRadiusSM: 9999,            // Pill tags
    },
    Segmented: {
      itemSelectedBg: '#bd9875',
      itemSelectedColor: '#202332',
      trackBg: 'rgba(32, 35, 50, 0.7)',
      borderRadius: 9999,
    },
    Menu: {
      darkItemBg: '#202332',
      darkItemSelectedBg: 'rgba(189, 152, 117, 0.18)',
      darkItemSelectedColor: '#bd9875',
    },
    Select: {
      selectorBg: 'rgba(32, 35, 50, 0.75)',
      colorBgElevated: '#202332',
      colorText: '#f0ebe5',
      colorTextPlaceholder: 'rgba(165, 182, 188, 0.75)',
      optionSelectedBg: '#bd9875',
      optionSelectedColor: '#202332',
      optionActiveBg: 'rgba(189, 152, 117, 0.18)',
      borderRadius: 12,
    },
    Dropdown: {
      colorBgElevated: '#202332',
      colorText: '#f0ebe5',
      borderRadiusLG: 14,
    },
    DatePicker: {
      colorBgElevated: '#202332',
      colorText: '#f0ebe5',
      colorTextHeading: '#bd9875',
      colorTextDescription: '#9cb0b6',
      colorTextDisabled: 'rgba(156, 176, 182, 0.35)',
      cellHoverBg: 'rgba(189, 152, 117, 0.22)',
      cellActiveWithRangeBg: 'rgba(189, 152, 117, 0.28)',
      cellRangeBorderColor: '#bd9875',
      borderRadius: 10,
    },
    Drawer: {
      colorBgElevated: '#202332',
      colorText: '#f0ebe5',
      colorTextHeading: '#f0ebe5',
      colorBorder: 'rgba(139, 154, 159, 0.25)',
    },
    Tabs: {
      itemColor: '#9cb0b6',
      itemHoverColor: '#f0ebe5',
      itemSelectedColor: '#bd9875',
      itemActiveColor: '#d4b595',
      inkBarColor: '#bd9875',
      titleFontSize: 14,
    },
    Pagination: {
      itemActiveBg: '#bd9875',
      itemBg: 'rgba(32, 35, 50, 0.75)',
      itemSize: 32,
      borderRadius: 8,
    },
    Tooltip: {
      colorBgSpotlight: '#151722',
      colorTextLightSolid: '#f0ebe5',
      borderRadius: 8,
    },
    Switch: {
      colorPrimary: '#bd9875',
      colorPrimaryHover: '#d4b595',
    },
    Checkbox: {
      colorPrimary: '#bd9875',
      colorPrimaryHover: '#d4b595',
    },
    Radio: {
      colorPrimary: '#bd9875',
      dotColorDisabled: 'rgba(189, 152, 117, 0.2)',
    },
    Spin: {
      colorPrimary: '#bd9875',
    },
    Message: {
      contentBg: '#242838',
      colorText: '#f0ebe5',
      borderRadiusLG: 12,
    },
    Notification: {
      colorBgElevated: '#242838',
      colorText: '#f0ebe5',
      colorTextHeading: '#bd9875',
      borderRadiusLG: 14,
    },
  },
};
