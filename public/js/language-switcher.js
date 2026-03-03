// GreenHOMEnergy Website - Language Switcher

class LanguageSwitcher {
  constructor() {
    this.languages = {
      'de': { name: 'Deutsch', flag: '🇩🇪' },
      'en': { name: 'English', flag: '🇬🇧' }
    };
    
    this.currentLanguage = this.getStoredLanguage() || this.detectBrowserLanguage() || 'de';
    this.dropdown = null;
    
    this.init();
  }
  
  init() {
    this.createDropdown();
    this.bindEvents();
  }
  
  createDropdown() {
    const languageSwitcher = document.querySelector('.language-switcher');
    if (!languageSwitcher) return;
    
    this.dropdown = document.createElement('select');
    this.dropdown.className = 'language-dropdown';
    this.dropdown.setAttribute('aria-label', 'Sprache auswählen');
    
    // Create options
    Object.entries(this.languages).forEach(([code, lang]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${lang.flag} ${lang.name}`;
      option.selected = code === this.currentLanguage;
      this.dropdown.appendChild(option);
    });
    
    languageSwitcher.appendChild(this.dropdown);
  }
  
  bindEvents() {
    if (this.dropdown) {
      this.dropdown.addEventListener('change', (e) => {
        this.switchLanguage(e.target.value);
      });
    }
  }
  
  switchLanguage(languageCode) {
    if (this.languages[languageCode]) {
      this.currentLanguage = languageCode;
      this.storeLanguage(languageCode);
      
      // Update HTML lang attribute
      document.documentElement.lang = languageCode;
      
      // Trigger i18n update if available
      if (window.i18n && typeof window.i18n.setLanguage === 'function') {
        window.i18n.setLanguage(languageCode);
      }
      
      // Announce language change to screen readers
      this.announceLanguageChange(this.languages[languageCode].name);
      
      // Update dropdown selection
      if (this.dropdown) {
        this.dropdown.value = languageCode;
      }
    }
  }
  
  storeLanguage(languageCode) {
    try {
      localStorage.setItem('ghe-language', languageCode);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
  }
  
  getStoredLanguage() {
    try {
      return localStorage.getItem('ghe-language');
    } catch (e) {
      console.warn('Could not retrieve language preference:', e);
      return null;
    }
  }
  
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0];
    return this.languages[langCode] ? langCode : 'de';
  }
  
  announceLanguageChange(languageName) {
    // Create temporary announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Sprache geändert zu ${languageName}`;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen readers have processed it
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
  
  // Public method to get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  // Public method to get available languages
  getAvailableLanguages() {
    return { ...this.languages };
  }
}

// Initialize language switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.languageSwitcher = new LanguageSwitcher();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageSwitcher;
}
