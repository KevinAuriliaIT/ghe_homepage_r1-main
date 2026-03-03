// GreenHOMEnergy Website - Internationalization System (Refactored)

class I18nManager {
  constructor(supportedLanguages = { 'de': { name: 'Deutsch', flag: '🇩🇪' }, 'en': { name: 'English', flag: '🇬🇧' }, 'fr': { name: 'Français', flag: '🇫🇷' }, 'es': { name: 'Español', flag: '🇪🇸' }, 'pt': { name: 'Português', flag: '🇵🇹' } }) {
    this.supportedLanguages = supportedLanguages;
    this.translations = {};
    this.currentLanguage = this.getStoredLanguage() || this.detectBrowserLanguage() || 'de';
    
    // Eagerly initialize to avoid race conditions
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  async init() {
    try {
      await this.loadAllTranslations();
      this.createLanguageDropdowns(); // Changed method name
      this.applyTranslations();
      this.updateDocumentLanguage();
      this.bindEvents();
    } catch (error) {
      console.error('Failed to initialize i18n system:', error);
    }
  }

  async loadAllTranslations() {
    const promises = Object.keys(this.supportedLanguages).map(async lang => {
      try {
        // Load main translations
        const mainResponse = await fetch(`/locales/${lang}.json`);
        if (!mainResponse.ok) throw new Error(`Failed to load ${lang}.json`);
        const mainData = await mainResponse.json();
        
        // Load legal translations if available
        try {
          const legalResponse = await fetch(`/locales/legal-${lang}.json`);
          if (legalResponse.ok) {
            const legalData = await legalResponse.json();
            // Merge legal translations into main translations
            this.translations[lang] = { ...mainData, ...legalData };
          } else {
            this.translations[lang] = mainData;
          }
        } catch (legalError) {
          console.warn(`Legal translations not found for ${lang}, using main translations only`);
          this.translations[lang] = mainData;
        }
      } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
      }
    });
    await Promise.all(promises);
  }

  applyTranslations() {
    const langTranslations = this.translations[this.currentLanguage];
    if (!langTranslations) {
      console.warn(`No translations found for ${this.currentLanguage}`);
      return;
    }

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key, langTranslations);
      
      if (translation) {
        // Check for attribute-specific translations
        const attr = element.getAttribute('data-i18n-attr');
        if (attr) {
          element.setAttribute(attr, translation);
        } else {
          element.innerHTML = translation; // Use innerHTML to support simple tags like <br>
        }
      } else {
        console.warn(`Translation not found for key: ${key}`);
      }
    });
  }

  getTranslation(key, translations) {
    return key.split('.').reduce((obj, k) => (obj && obj[k] !== 'undefined') ? obj[k] : undefined, translations);
  }

  createLanguageDropdowns() {
    const containers = document.querySelectorAll('.language-switcher');
    if (containers.length === 0) return;

    containers.forEach(container => {
      // Clear previous content
      container.innerHTML = ''; 

      const dropdownWrapper = document.createElement('div');
      dropdownWrapper.className = 'custom-language-dropdown';
      dropdownWrapper.setAttribute('role', 'navigation');
      dropdownWrapper.setAttribute('aria-label', 'Sprachauswahl');

      const currentLangButton = document.createElement('button');
      currentLangButton.className = 'current-language-display';
      currentLangButton.setAttribute('aria-haspopup', 'true');
      currentLangButton.setAttribute('aria-expanded', 'false');
      currentLangButton.setAttribute('aria-controls', 'language-options');
      currentLangButton.innerHTML = this.supportedLanguages[this.currentLanguage].flag;

      const optionsList = document.createElement('ul');
      optionsList.className = 'language-options-list';
      optionsList.id = 'language-options';
      optionsList.setAttribute('role', 'menu');
      optionsList.setAttribute('aria-orientation', 'vertical');
      optionsList.setAttribute('tabindex', '-1'); // Make it focusable but not in tab order

      for (const [code, langData] of Object.entries(this.supportedLanguages)) {
        const listItem = document.createElement('li');
        listItem.setAttribute('role', 'none');
        const optionButton = document.createElement('button');
        optionButton.className = 'language-option';
        optionButton.setAttribute('role', 'menuitem');
        optionButton.setAttribute('data-lang', code);
        optionButton.textContent = `${langData.flag} ${langData.name}`;
        if (code === this.currentLanguage) {
          optionButton.classList.add('active');
          optionButton.setAttribute('aria-current', 'true');
        }
        listItem.appendChild(optionButton);
        optionsList.appendChild(listItem);
      }

      dropdownWrapper.appendChild(currentLangButton);
      dropdownWrapper.appendChild(optionsList);
      container.appendChild(dropdownWrapper);
    });
  }

  bindEvents() {
    document.querySelectorAll('.language-switcher').forEach(container => {
      const currentLangButton = container.querySelector('.current-language-display');
      const optionsList = container.querySelector('.language-options-list');

      if (currentLangButton && optionsList) {
        currentLangButton.addEventListener('click', () => {
          const isExpanded = currentLangButton.getAttribute('aria-expanded') === 'true';
          currentLangButton.setAttribute('aria-expanded', !isExpanded);
          optionsList.classList.toggle('open');
          if (!isExpanded) {
            optionsList.focus(); // Focus the list when opened
          }
        });

        optionsList.addEventListener('click', (e) => {
          const optionButton = e.target.closest('.language-option');
          if (optionButton) {
            const langCode = optionButton.getAttribute('data-lang');
            this.switchLanguage(langCode);
            // Close dropdown after selection
            currentLangButton.setAttribute('aria-expanded', 'false');
            optionsList.classList.remove('open');
            currentLangButton.focus(); // Return focus to the main button
          }
        });

        // Close dropdown if focus leaves it
        optionsList.addEventListener('blur', (e) => {
          if (!optionsList.contains(e.relatedTarget) && !currentLangButton.contains(e.relatedTarget)) {
            currentLangButton.setAttribute('aria-expanded', 'false');
            optionsList.classList.remove('open');
          }
        }, true); // Use capture phase for blur event

        // Close dropdown on escape key
        optionsList.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            currentLangButton.setAttribute('aria-expanded', 'false');
            optionsList.classList.remove('open');
            currentLangButton.focus();
          }
        });
      }
    });
  }

  switchLanguage(langCode) {
    if (this.supportedLanguages[langCode]) {
      this.currentLanguage = langCode;
      this.storeLanguage(langCode);
      this.applyTranslations();
      this.updateDocumentLanguage();
      this.announceLanguageChange(this.supportedLanguages[langCode].name); // Pass name
      // Update all custom dropdowns
      document.querySelectorAll('.custom-language-dropdown').forEach(dropdownWrapper => {
        const currentLangButton = dropdownWrapper.querySelector('.current-language-display');
        if (currentLangButton) {
          currentLangButton.innerHTML = this.supportedLanguages[langCode].flag;
        }
        // Update active state in options list
        dropdownWrapper.querySelectorAll('.language-option').forEach(optionButton => {
          if (optionButton.getAttribute('data-lang') === langCode) {
            optionButton.classList.add('active');
            optionButton.setAttribute('aria-current', 'true');
          } else {
            optionButton.classList.remove('active');
            optionButton.removeAttribute('aria-current');
          }
        });
      });
    }
  }

  updateDocumentLanguage() {
    document.documentElement.lang = this.currentLanguage;
  }

  detectBrowserLanguage() {
    const lang = (navigator.language || navigator.userLanguage).split('-')[0];
    return this.supportedLanguages[lang] ? lang : null;
  }

  storeLanguage(langCode) {
    try {
      localStorage.setItem('ghe-language', langCode);
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
  
  announceLanguageChange(languageName) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Language changed to ${languageName}`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }
}

// Initialize the i18n manager
window.i18nManager = new I18nManager();
