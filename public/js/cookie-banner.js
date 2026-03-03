// GreenHOMEnergy Website - GDPR Cookie Banner (Floating Popup) v1.1

class CookieBanner {
  constructor() {
    this.cookieSettings = {
      necessary: true, // Always true, cannot be disabled
      analytics: false,
      marketing: false
    };

    this.banner = null;
    this.settingsModal = null;
    this.cookieName = 'ghe-cookie-consent';
    this.cookieExpiry = 365; // days
    this._modalKeydownHandler = null;

    this.init();
  }

  init() {
    const existingConsent = this.getStoredConsent();
    if (!existingConsent) {
      this.createBanner();
      this.showBanner();
    } else {
      this.cookieSettings = { ...this.cookieSettings, ...existingConsent };
      this.applyCookieSettings();
    }
  }

  createBanner() {
    this.banner = document.createElement('div');
    this.banner.className = 'cookie-banner';
    this.banner.setAttribute('role', 'dialog');
    this.banner.setAttribute('aria-labelledby', 'cookie-banner-title');
    this.banner.setAttribute('aria-describedby', 'cookie-banner-description');

    this.banner.innerHTML = `
      <div class="cookie-banner-content">
        <div class="cookie-banner-text">
          <h3 id="cookie-banner-title" data-i18n="cookie.title">Cookie settings</h3>
          <p id="cookie-banner-description" data-i18n="cookie.description">
            We use cookies to improve your experience. Necessary cookies are required for basic functionality.
          </p>
          <a class="cookie-privacy-link" href="/legal/#datenschutz" data-i18n="cookie.privacy_link_text">Privacy Policy</a>
        </div>
        <div class="cookie-banner-actions">
          <button type="button" class="btn btn-secondary cookie-settings-btn" data-i18n="cookie.btn_settings">
            Settings
          </button>
          <button type="button" class="btn cookie-accept-all-btn" data-i18n="cookie.btn_accept_all">
            Accept all
          </button>
          <button type="button" class="btn btn-secondary cookie-accept-necessary-btn" data-i18n="cookie.btn_accept_necessary">
            Only necessary
          </button>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.banner);

    // Apply translations if i18n is available
    try {
      window.i18nManager?.applyTranslations();
    } catch (e) {
      console.warn('Could not apply translations to cookie banner:', e);
    }

    // Bind events
    this.bindBannerEvents();
  }

  createSettingsModal() {
    this.settingsModal = document.createElement('div');
    this.settingsModal.className = 'cookie-settings-modal';
    this.settingsModal.setAttribute('role', 'dialog');
    this.settingsModal.setAttribute('aria-labelledby', 'cookie-settings-title');
    this.settingsModal.setAttribute('aria-modal', 'true');

    this.settingsModal.innerHTML = `
      <div class="cookie-settings-overlay"></div>
      <div class="cookie-settings-content">
        <div class="cookie-settings-header">
          <h2 id="cookie-settings-title" data-i18n="cookie.modal.title">Cookie settings</h2>
          <button type="button" class="cookie-settings-close" aria-label="Close">×</button>
        </div>
        <div class="cookie-settings-body">
          <p data-i18n="cookie.modal.intro">Choose which cookies you want to allow:</p>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 data-i18n="cookie.cat.necessary.title">Necessary cookies</h3>
              <label class="cookie-toggle">
                <input type="checkbox" checked disabled aria-describedby="necessary-description">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <p id="necessary-description" class="cookie-category-description" data-i18n="cookie.cat.necessary.desc">
              These cookies are required for the basic functions of the website and cannot be disabled.
            </p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 data-i18n="cookie.cat.analytics.title">Analytics cookies</h3>
              <label class="cookie-toggle">
                <input type="checkbox" id="analytics-toggle" aria-describedby="analytics-description">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <p id="analytics-description" class="cookie-category-description" data-i18n="cookie.cat.analytics.desc">
              These cookies help us understand how visitors interact with our website.
            </p>
          </div>

          <div class="cookie-category">
            <div class="cookie-category-header">
              <h3 data-i18n="cookie.cat.marketing.title">Marketing cookies</h3>
              <label class="cookie-toggle">
                <input type="checkbox" id="marketing-toggle" aria-describedby="marketing-description">
                <span class="cookie-toggle-slider"></span>
              </label>
            </div>
            <p id="marketing-description" class="cookie-category-description" data-i18n="cookie.cat.marketing.desc">
              These cookies are used to show you relevant advertising.
            </p>
          </div>
        </div>
        <div class="cookie-settings-footer">
          <button type="button" class="btn btn-secondary cookie-settings-cancel" data-i18n="cookie.modal.btn_cancel">Cancel</button>
          <button type="button" class="btn cookie-settings-save" data-i18n="cookie.modal.btn_save">Save settings</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.settingsModal);

    // Apply translations if i18n is available
    try {
      window.i18nManager?.applyTranslations();
    } catch (e) {
      console.warn('Could not apply translations to cookie settings modal:', e);
    }

    this.bindSettingsEvents();
  }

  bindBannerEvents() {
    const acceptAllBtn = this.banner.querySelector('.cookie-accept-all-btn');
    const acceptNecessaryBtn = this.banner.querySelector('.cookie-accept-necessary-btn');
    const settingsBtn = this.banner.querySelector('.cookie-settings-btn');

    acceptAllBtn.addEventListener('click', () => {
      this.acceptAllCookies();
    });

    acceptNecessaryBtn.addEventListener('click', () => {
      this.acceptNecessaryCookies();
    });

    settingsBtn.addEventListener('click', () => {
      this.showSettings();
    });
  }

  bindSettingsEvents() {
    const closeBtn = this.settingsModal.querySelector('.cookie-settings-close');
    const cancelBtn = this.settingsModal.querySelector('.cookie-settings-cancel');
    const saveBtn = this.settingsModal.querySelector('.cookie-settings-save');
    const overlay = this.settingsModal.querySelector('.cookie-settings-overlay');

    const analyticsToggle = this.settingsModal.querySelector('#analytics-toggle');
    const marketingToggle = this.settingsModal.querySelector('#marketing-toggle');

    // Set initial toggle states
    analyticsToggle.checked = this.cookieSettings.analytics;
    marketingToggle.checked = this.cookieSettings.marketing;

    closeBtn.addEventListener('click', () => this.hideSettings());
    cancelBtn.addEventListener('click', () => this.hideSettings());
    overlay.addEventListener('click', () => this.hideSettings());

    saveBtn.addEventListener('click', () => {
      this.cookieSettings.analytics = analyticsToggle.checked;
      this.cookieSettings.marketing = marketingToggle.checked;
      this.saveConsent();
      this.hideSettings();
      this.hideBanner();
    });

    // Escape key to close
    this.settingsModal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hideSettings();
      }
    });
  }

  showBanner() {
    requestAnimationFrame(() => this.banner.classList.add('show'));
  }

  hideBanner() {
    this.banner?.classList.remove('show');
  }

  showSettings() {
    if (!this.settingsModal) {
      this.createSettingsModal();
    }

    this.settingsModal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Focus trap setup
    const focusableSelectors = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(this.settingsModal.querySelectorAll(focusableSelectors))
      .filter(el => el.offsetParent !== null);

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) first.focus();

    this._modalKeydownHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    this.settingsModal.addEventListener('keydown', this._modalKeydownHandler);
  }

  hideSettings() {
    if (!this.settingsModal) return;
    this.settingsModal.classList.remove('show');
    document.body.style.overflow = '';

    if (this._modalKeydownHandler) {
      this.settingsModal.removeEventListener('keydown', this._modalKeydownHandler);
      this._modalKeydownHandler = null;
    }
  }

  acceptAllCookies() {
    this.cookieSettings = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    this.saveConsent();
    this.hideBanner();
  }

  acceptNecessaryCookies() {
    this.cookieSettings = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    this.saveConsent();
    this.hideBanner();
  }

  saveConsent() {
    const consentData = {
      ...this.cookieSettings,
      timestamp: new Date().toISOString(),
      version: '1.1'
    };

    try {
      // Save to localStorage
      localStorage.setItem(this.cookieName, JSON.stringify(consentData));

      // Save to cookie for server-side access
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.cookieExpiry);

      document.cookie = `${this.cookieName}=${JSON.stringify(consentData)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;

      this.applyCookieSettings();

    } catch (e) {
      console.warn('Could not save cookie consent:', e);
    }
  }

  getStoredConsent() {
    try {
      const stored = localStorage.getItem(this.cookieName);
      if (stored) {
        const data = JSON.parse(stored);
        const consentDate = new Date(data.timestamp);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - this.cookieExpiry);

        if (consentDate > expiryDate) {
          return {
            necessary: !!data.necessary,
            analytics: !!data.analytics,
            marketing: !!data.marketing
          };
        }
      }
    } catch (e) {
      console.warn('Could not retrieve cookie consent:', e);
    }

    return null;
  }

  applyCookieSettings() {
    if (this.cookieSettings.analytics) {
      this.enableAnalytics();
    } else {
      this.disableAnalytics();
    }

    if (this.cookieSettings.marketing) {
      this.enableMarketing();
    } else {
      this.disableMarketing();
    }

    document.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: this.cookieSettings
    }));
  }

  enableAnalytics() {
    // Placeholder for analytics implementation
    console.log('Analytics cookies enabled');
    // Example: Load Google Analytics, Matomo, etc.
  }

  disableAnalytics() {
    console.log('Analytics cookies disabled');
    // Example: Remove analytics scripts, clear analytics cookies
  }

  enableMarketing() {
    console.log('Marketing cookies enabled');
    // Example: Load marketing pixels, advertising scripts
  }

  disableMarketing() {
    console.log('Marketing cookies disabled');
    // Example: Remove marketing scripts, clear marketing cookies
  }

  // Public method to get current settings
  getSettings() {
    return { ...this.cookieSettings };
  }

  // Public method to show settings modal
  openSettings() {
    this.showSettings();
  }
}

// Initialize cookie banner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cookieBanner = new CookieBanner();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieBanner;
}
