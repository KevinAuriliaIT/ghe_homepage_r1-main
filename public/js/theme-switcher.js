// GreenHOMEnergy Website - Theme Switcher

class ThemeSwitcher {
  constructor() {
    this.themes = {
      'bright': 'Bright Mode',
      'dark': 'Dark Mode',
    };
    
    this.currentTheme = this.getStoredTheme() || 'bright';
    this.switch = null;
    
    this.init();
  }
  
  init() {
    this.createSwitch();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
  }
  
  createSwitch() {
    const themeSwitcherContainer = document.querySelector('.theme-switcher');
    if (!themeSwitcherContainer) return;

    this.switch = document.createElement('label');
    this.switch.className = 'theme-switch';
    this.switch.setAttribute('aria-label', 'Toggle Dark Mode');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.currentTheme === 'dark';

    const slider = document.createElement('span');
    slider.className = 'slider round';
    
    // Add sun and moon icons
    const sunIcon = document.createElement('span');
    sunIcon.className = 'sun-icon';
    sunIcon.innerHTML = '☀️';
    
    const moonIcon = document.createElement('span');
    moonIcon.className = 'moon-icon';
    moonIcon.innerHTML = '🌙';
    
    slider.appendChild(sunIcon);
    slider.appendChild(moonIcon);

    this.switch.appendChild(input);
    this.switch.appendChild(slider);
    
    themeSwitcherContainer.appendChild(this.switch);
  }
  
  bindEvents() {
    if (this.switch) {
      const input = this.switch.querySelector('input');
      input.addEventListener('change', (e) => {
        this.switchTheme(e.target.checked ? 'dark' : 'bright');
      });
    }
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!this.getStoredTheme()) {
          this.applySystemTheme();
        }
      });
    }
  }
  
  switchTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme(themeName);
      this.storeTheme(themeName);
      
      // Announce theme change to screen readers
      this.announceThemeChange(this.themes[themeName]);
    }
  }
  
  applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update switch state
    if (this.switch) {
      this.switch.querySelector('input').checked = themeName === 'dark';
    }
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(themeName);
  }
  
  updateMetaThemeColor(themeName) {
    const themeColors = {
      'bright': '#2d5016', // Same as old solar-green
      'dark': '#111827',   // Same as old modern-dark
    };
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = themeColors[themeName] || themeColors['bright'];
  }
  
  storeTheme(themeName) {
    try {
      localStorage.setItem('ghe-theme', themeName);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
  }
  
  getStoredTheme() {
    try {
      return localStorage.getItem('ghe-theme');
    } catch (e) {
      console.warn('Could not retrieve theme preference:', e);
      return null;
    }
  }
  
  applySystemTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? 'dark' : 'bright';
    this.applyTheme(systemTheme);
  }
  
  announceThemeChange(themeName) {
    // Create temporary announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Farbschema geändert zu ${themeName}`;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen readers have processed it
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  // Public method to get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  // Public method to get available themes
  getAvailableThemes() {
    return { ...this.themes };
  }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeSwitcher = new ThemeSwitcher();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeSwitcher;
}
