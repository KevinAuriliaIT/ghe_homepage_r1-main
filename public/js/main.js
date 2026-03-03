// GreenHOMEnergy Website - Main JavaScript

class GHEWebsite {
  constructor() {
    this.isLoaded = false;
    this.lottieAnimation = null; // Initialize lottieAnimation property
    this.init();
  }
  
  init() {
    this.setupFormValidation();
    this.setupScrollEffects();
    this.setupLazyLoading();
    this.setupAnimations();
    this.initLottieLogo(); // Initialize Lottie logo
    this.bindEvents();
    
    // Mark as loaded
    this.isLoaded = true;
    document.body.classList.add('loaded');
  }
  
  setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });
      
      // Real-time validation - only after user interaction
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        let hasBeenTouched = false;
        
        // Mark field as touched when user interacts with it
        input.addEventListener('focus', () => {
          hasBeenTouched = true;
          input.setAttribute('data-touched', 'true');
          input.classList.add('touched');
        });
        
        input.addEventListener('blur', () => {
          if (hasBeenTouched) {
            this.validateField(input);
          }
        });
        
        input.addEventListener('input', () => {
          if (hasBeenTouched) {
            // Clear error if user is typing and field becomes valid
            if (this.isFieldValid(input)) {
              this.clearFieldError(input);
            }
          }
        });
        
        // For checkboxes, validate on change
        if (input.type === 'checkbox') {
          input.addEventListener('change', () => {
            if (hasBeenTouched) {
              this.validateField(input);
            }
          });
        }
      });
    });
  }
  
  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  isFieldValid(field) {
    const value = field.value.trim();
    const type = field.type;
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
      return false;
    }
    
    // Email validation
    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return false;
      }
    }
    
    // Phone validation
    if (type === 'tel' && value) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(value)) {
        return false;
      }
    }
    
    // Minimum length check
    if (field.hasAttribute('minlength')) {
      const minLength = parseInt(field.getAttribute('minlength'));
      if (value.length < minLength) {
        return false;
      }
    }
    
    return true;
  }
  
  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    let isValid = true;
    let errorMessage = '';
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Dieses Feld ist erforderlich.';
    }
    
    // Email validation
    else if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      }
    }
    
    // Phone validation
    else if (type === 'tel' && value) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'Bitte geben Sie eine gültige Telefonnummer ein.';
      }
    }
    
    // Minimum length check
    else if (field.hasAttribute('minlength')) {
      const minLength = parseInt(field.getAttribute('minlength'));
      if (value.length < minLength) {
        isValid = false;
        errorMessage = `Mindestens ${minLength} Zeichen erforderlich.`;
      }
    }
    
    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }
  
  showFieldValidation(field, isValid, errorMessage) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    // Remove existing error
    const existingError = formGroup.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Update field attributes
    field.setAttribute('aria-invalid', !isValid);
    
    if (!isValid && errorMessage) {
      // Add error message
      const errorElement = document.createElement('span');
      errorElement.className = 'form-error';
      errorElement.textContent = errorMessage;
      errorElement.setAttribute('role', 'alert');
      
      formGroup.appendChild(errorElement);
      
      // Associate error with field
      const errorId = `error-${field.id || Math.random().toString(36).substr(2, 9)}`;
      errorElement.id = errorId;
      field.setAttribute('aria-describedby', errorId);
    } else {
      field.removeAttribute('aria-describedby');
    }
  }
  
  clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    const errorElement = formGroup.querySelector('.form-error');
    if (errorElement) {
      errorElement.remove();
    }
    
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
  
  setupScrollEffects() {
    // Scroll to top button
    this.createScrollToTopButton();
    
    // Header scroll effect
    this.setupHeaderScrollEffect();
    
    // Reveal animations on scroll
    this.setupScrollReveal();
  }
  
  createScrollToTopButton() {
    const button = document.createElement('button');
    button.className = 'scroll-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Nach oben scrollen');
    button.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--accent-color);
      color: white;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: var(--transition);
      z-index: 1000;
      box-shadow: var(--shadow);
    `;
    
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
      } else {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      }
    });
    
    document.body.appendChild(button);
  }
  
  setupHeaderScrollEffect() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScrollY = window.pageYOffset;
    const scrollTriggerHeight = 200; // Pixels scrolled before animation completes
    const animationStartFrame = 0;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.pageYOffset;

      if (currentScrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }

      // Lottie animation control based on scroll
      if (this.lottieAnimation && this.lottieAnimation.isLoaded) {
        if (currentScrollY > 100) {
          this.lottieAnimation.setDirection(1);
          this.lottieAnimation.play();
        } else {
          this.lottieAnimation.setDirection(-1);
          this.lottieAnimation.play();
        }
      }

      lastScrollY = currentScrollY;
    });

    // Add hover effect for the scrolled header
    header.addEventListener('mouseenter', () => {
      if (header.classList.contains('scrolled')) {
        header.classList.add('hover-expanded');
      }
    });

    header.addEventListener('mouseleave', () => {
      if (header.classList.contains('scrolled')) {
        header.classList.remove('hover-expanded');
      }
    });
  }
  
  setupScrollReveal() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, observerOptions);
    
    // Observe elements that should animate in
    const animateElements = document.querySelectorAll('.card, .service-item, .project-item, .team-member');
    animateElements.forEach(el => {
      el.classList.add('reveal');
      observer.observe(el);
    });
  }
  
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });
      
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }
  
  setupAnimations() {
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
      .reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      
      .reveal.revealed {
        opacity: 1;
        transform: translateY(0);
      }
      
      .header {
        transition: transform 0.3s ease, background-color 0.3s ease;
      }
      
      
      .lazy {
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .lazy:not([src]) {
        background: var(--border-color);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .reveal {
          opacity: 1;
          transform: none;
          transition: none;
        }
        
        .header {
          transition: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  initLottieLogo() {
    const lottieLogoContainer = document.getElementById('lottie-logo');
    if (lottieLogoContainer && typeof lottie !== 'undefined') {
      this.lottieAnimation = lottie.loadAnimation({ // Store animation instance
        container: lottieLogoContainer,
        renderer: 'svg',
        loop: false, // Disable loop
        autoplay: false, // Disable autoplay
        path: '/assets/logo/greenhomenergy2025.json'
      });

      this.lottieAnimation.setSpeed(2.5); // Set animation speed to 250%

      this.lottieAnimation.addEventListener('data_ready', () => {
        this.animationEndFrame = 110; 
        this.lottieAnimation.goToAndStop(0, true); // Go to frame 0 (or 1 if 1-indexed) and stop
      });

      this.lottieAnimation.addEventListener('data_failed', () => {
        console.warn('Lottie animation failed to load. Displaying fallback image.');
        lottieLogoContainer.style.display = 'none';
        const fallbackImage = lottieLogoContainer.nextElementSibling;
        if (fallbackImage && fallbackImage.classList.contains('logo-fallback')) {
          fallbackImage.style.display = 'block';
        }
      });
    } else if (lottieLogoContainer) {
      console.warn('Lottie library not loaded or logo container not found. Displaying fallback image.');
      lottieLogoContainer.style.display = 'none';
      const fallbackImage = lottieLogoContainer.nextElementSibling;
      if (fallbackImage && fallbackImage.classList.contains('logo-fallback')) {
        fallbackImage.style.display = 'block';
      }
    }
  }
  
  bindEvents() {
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
      logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    // Handle external links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="http"]');
      if (link && !link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
    
    // Handle form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.tagName === 'FORM') {
        this.handleFormSubmission(form, e);
      }
    });
    
    // Keyboard navigation improvements
    document.addEventListener('keydown', (e) => {
      // Skip to main content with Alt+S
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const main = document.querySelector('main, #main-content');
        if (main) {
          main.focus();
          main.scrollIntoView();
        }
      }
    });
  }
  
  handleFormSubmission(form, event) {
    event.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Wird gesendet...';
    submitButton.disabled = true;
    submitButton.classList.add('loading');
    
    // Simulate form submission (replace with actual implementation)
    setTimeout(() => {
      this.showFormSuccess(form);
      
      // Reset button
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
      
      // Reset form
      form.reset();
      
      // Clear any validation errors
      const errors = form.querySelectorAll('.form-error');
      errors.forEach(error => error.remove());
      
    }, 2000);
  }
  
  showFormSuccess(form) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success';
    successMessage.innerHTML = `
      <span class="success-icon">✓</span>
      Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.
    `;
    
    form.parentNode.insertBefore(successMessage, form.nextSibling);
    
    // Remove success message after 5 seconds
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.parentNode.removeChild(successMessage);
      }
    }, 5000);
    
    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'Nachricht erfolgreich gesendet';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  // Public utility methods
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      background: var(--card-background);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
  
  scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
      const targetPosition = element.offsetTop - headerHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gheWebsite = new GHEWebsite();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GHEWebsite;
}
