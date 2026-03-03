// GreenHOMEnergy Website - Navigation

class Navigation {
  constructor() {
    this.header = null;
    this.mobileMenuToggle = null;
    this.mobileMenu = null;
    this.isMenuOpen = false;
    this.lastScrollY = 0;
    this.isFloating = false;
    
    this.init();
  }
  
  init() {
    this.header = document.querySelector('.header');
    this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    this.mobileMenu = document.querySelector('.mobile-menu');
    
    if (!this.header) return;
    
    this.bindEvents();
    this.handleScroll(); // Initial call
    this.setActiveNavLink();
  }
  
  bindEvents() {
    // Mobile menu toggle
    if (this.mobileMenuToggle) {
      this.mobileMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
    }
    
    // Close mobile menu when clicking on links
    if (this.mobileMenu) {
      const mobileLinks = this.mobileMenu.querySelectorAll('.mobile-nav-link');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.closeMobileMenu();
        });
      });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.mobileMenu?.contains(e.target) && 
          !this.mobileMenuToggle?.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
    
    // Scroll handling
    window.addEventListener('scroll', () => {
      this.handleScroll();
    }, { passive: true });
    
    // Resize handling
    window.addEventListener('resize', () => {
      // Close mobile menu on resize to desktop
      if (window.innerWidth > 768 && this.isMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }
  
  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }
  
  openMobileMenu() {
    if (!this.mobileMenu || !this.mobileMenuToggle) return;
    
    this.isMenuOpen = true;
    this.mobileMenu.classList.add('active');
    this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus first menu item for accessibility
    const firstLink = this.mobileMenu.querySelector('.mobile-nav-link');
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
    
    // Announce to screen readers
    this.announceMenuState('Menü geöffnet');
  }
  
  closeMobileMenu() {
    if (!this.mobileMenu || !this.mobileMenuToggle) return;
    
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove('active');
    this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Return focus to toggle button
    this.mobileMenuToggle.focus();
    
    // Announce to screen readers
    this.announceMenuState('Menü geschlossen');
  }
  
  handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Add/remove scrolled class
    if (currentScrollY > 50) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
    
    // Add/remove floating class
    if (currentScrollY > 100 && !this.isFloating) {
      this.header.classList.add('header--floating');
      this.isFloating = true;
    } else if (currentScrollY <= 100 && this.isFloating) {
      this.header.classList.remove('header--floating');
      this.isFloating = false;
    }
    
    this.lastScrollY = currentScrollY;
  }
  
  setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      
      const linkPath = new URL(link.href).pathname;
      
      // Exact match for home page
      if (currentPath === '/' && linkPath === '/') {
        link.classList.add('active');
      }
      // Partial match for other pages
      else if (currentPath !== '/' && linkPath !== '/' && currentPath.startsWith(linkPath)) {
        link.classList.add('active');
      }
    });
  }
  
  announceMenuState(message) {
    // Create temporary announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove announcement after screen readers have processed it
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
  
  // Public method to close menu (can be called from other scripts)
  closeMenu() {
    this.closeMobileMenu();
  }
  
  // Public method to get menu state
  isMenuOpen() {
    return this.isMenuOpen;
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.navigation = new Navigation();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}
