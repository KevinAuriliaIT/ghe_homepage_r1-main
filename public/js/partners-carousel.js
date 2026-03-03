/**
 * Partners Carousel - Automatic Logo Loading and Animation
 * Dynamically loads all partner logos from the assets/images/partners/ directory
 * and creates an infinite scrolling carousel with two offset tracks
 */

class PartnersCarousel {
  constructor() {
    this.partnersPath = '/assets/images/partners/';
    this.supportedFormats = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];
    this.track1 = document.getElementById('partners-track-1');
    this.track2 = document.getElementById('partners-track-2');
    this.logos = [];
    
    this.init();
  }

  async init() {
    try {
      await this.loadPartnerLogos();
      this.populateTracks();
      this.setupIntersectionObserver();
    } catch (error) {
      console.warn('Partners carousel could not be initialized:', error);
    }
  }

  /**
   * Loads all partner logos by attempting to fetch known logo files
   * This approach works with static sites where directory listing isn't available
   */
  async loadPartnerLogos() {
    // Dynamically retrieve logo filenames from the asset list
    const dynamicLogos = [
      'Axpo.svg',
      'Bayernwerk_Logo.png',
      'CKW.svg',
      'creos-logo.png',
      'EcorusLogo.svg',
      'EDP_2022.svg',
      'Électricité_de_France_logo.svg',
      'Enovos-Logo-ohne-Verlauf.webp',
      'EON_Logo.svg',
      'famis.svg',
      'lynus.svg',
      'MKG.png',
      'nehr.svg',
      'node_energy.svg',
      'paulwagner.svg',
      'pmt.png',
      'socom.png',
      'solarmarkt.svg',
      'sungrow.png',
      'VGP_Group_logo.svg.png',
      'Voestalpine.svg',
      'VSE_AG_logo.svg'
    ];

    // Verify which logos actually exist and are accessible
    const logoPromises = dynamicLogos.map(async (filename) => {
      try {
        const response = await fetch(this.partnersPath + filename, { method: 'HEAD' });
        if (response.ok) {
          return {
            filename,
            path: this.partnersPath + filename,
            name: this.extractCompanyName(filename)
          };
        }
      } catch (error) {
        // Log a warning if a logo could not be loaded, but don't stop the process
        console.warn(`Could not load logo: ${filename}`);
      }
      return null;
    });

    const results = await Promise.all(logoPromises);
    this.logos = results.filter(logo => logo !== null); // Filter out any null results from failed loads
    
    console.log(`Loaded ${this.logos.length} partner logos`);
  }

  /**
   * Extracts a clean company name from the filename
   */
  extractCompanyName(filename) {
    return filename
      .replace(/\.(png|jpg|jpeg|svg|gif|webp)$/i, '') // Remove file extension
      .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
      .replace(/Logo|Ag|Gmbh/gi, '') // Remove common company suffixes
      .trim(); // Trim whitespace
  }

  /**
   * Creates logo elements for the carousel
   */
  createLogoElement(logo, index) {
    const img = document.createElement('img');
    img.src = logo.path;
    img.alt = `${logo.name} Logo`;
    img.className = 'partner-logo';
    // Remove lazy loading to prevent layout shifts during animation
    img.loading = 'eager';
    
    // Add error handling
    img.onerror = () => {
      console.warn(`Failed to load logo: ${logo.filename}`);
      img.style.display = 'none';
    };

    // Add load event for smooth appearance
    img.onload = () => {
      img.style.opacity = '1';
    };

    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease-in-out';

    return img;
  }

  /**
   * Preloads all logos to prevent layout shifts during animation
   */
  async preloadLogos() {
    const preloadPromises = this.logos.map(logo => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(logo);
        img.onerror = () => {
          console.warn(`Failed to preload logo: ${logo.filename}`);
          resolve(logo); // Still resolve to not block other logos
        };
        img.src = logo.path;
      });
    });

    await Promise.all(preloadPromises);
    console.log('All partner logos preloaded');
  }

  /**
   * Waits for all images within a given track element to load.
   * This is crucial for accurate dimension calculation needed for animation.
   */
  async preloadAllTrackImages(trackElement) {
    const images = trackElement.querySelectorAll('.partner-logo');
    if (images.length === 0) return;

    await Promise.all(Array.from(images).map(img => {
      // If the image is already complete, resolve immediately
      if (img.complete) return Promise.resolve();
      // Otherwise, wait for the 'load' event
      return new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true }); // Also resolve on error to prevent endless waiting
      });
    }));
    console.log('All images within track preloaded for dimension calculation.');
  }

  /**
   * Calculates the optimal number of copies and animation duration
   */
  calculateOptimalAnimation(trackElement) {
    // Wait for images to load and get actual dimensions
    // Get all logo elements to calculate their total width including gaps
    const logos = trackElement.querySelectorAll('.partner-logo');
    let totalWidth = 0;
    
    logos.forEach(logo => {
      // Add logo width and a fixed gap (64px = 4rem) for spacing
      totalWidth += logo.offsetWidth + 64; 
    });

    const viewportWidth = window.innerWidth;
    // Calculate the minimum number of copies needed to fill at least twice the viewport width
    // This ensures a seamless loop and avoids animation breaks when content is short
    const minCopies = Math.ceil((viewportWidth * 2) / totalWidth) + 2; // Add extra buffer copies

    // Calculate animation duration based on total content width and desired speed
    // This maintains a consistent scrolling speed regardless of the number of logos
    const pixelsPerSecond = 50; // Define scrolling speed (adjust as needed)
    const duration = totalWidth / pixelsPerSecond;
    
    return {
      copies: Math.max(4, minCopies),
      duration: Math.max(20, duration)
    };
  }

  /**
   * Populates both carousel tracks with logos
   */
  async populateTracks() {
    if (this.logos.length === 0) {
      console.warn('No partner logos found');
      return;
    }

    if (this.logos.length === 0) {
      console.warn('No partner logos found to populate tracks.');
      return;
    }

    // Clear existing content
    this.track1.innerHTML = '';
    this.track2.innerHTML = '';

    // Create a temporary track to measure dimensions accurately after images load
    const tempTrack = document.createElement('div');
    tempTrack.style.position = 'absolute';
    tempTrack.style.visibility = 'hidden';
    tempTrack.style.whiteSpace = 'nowrap';
    document.body.appendChild(tempTrack);

    this.logos.forEach((logo, index) => {
      const logoElement = this.createLogoElement(logo, index);
      tempTrack.appendChild(logoElement);
    });

    await this.preloadAllTrackImages(tempTrack);

    // Calculate optimal animation settings based on the temporary track
    const settings = this.calculateOptimalAnimation(tempTrack);
    document.body.removeChild(tempTrack); // Remove temporary track

    // Populate first track with calculated copies
    for (let copy = 0; copy < settings.copies; copy++) {
      this.logos.forEach((logo, index) => {
        const logoElement = this.createLogoElement(logo, index);
        this.track1.appendChild(logoElement);
      });
    }

    // Populate second track with different order for visual variety
    const shuffledLogos = [...this.logos].reverse();
    for (let copy = 0; copy < settings.copies; copy++) {
      shuffledLogos.forEach((logo, index) => {
        const logoElement = this.createLogoElement(logo, index);
        this.track2.appendChild(logoElement);
      });
    }

    // Apply calculated durations for smooth, consistent animation
    this.track1.style.animationDuration = `${settings.duration}s`;
    this.track2.style.animationDuration = `${settings.duration * 1.1}s`; // Slightly different for visual variety
    
    console.log(`Animation optimized: ${settings.copies} copies, ${settings.duration}s duration`);
  }

  /**
   * Sets up intersection observer for performance optimization
   * Pauses animation when carousel is not visible with smooth transitions
   */
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const carousel = document.querySelector('.partners-carousel');
    if (!carousel) return;

    let isVisible = true;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const tracks = entry.target.querySelectorAll('.partners-track');
        
        if (entry.isIntersecting) {
          if (!isVisible) { // Resume only if it was previously not visible
            isVisible = true;
            tracks.forEach(track => {
              track.style.transition = 'opacity 0.3s ease-in-out';
              track.style.opacity = '1';
              track.style.animationPlayState = 'running';
            });
          }
        } else {
          if (isVisible) { // Pause only if it was previously visible
            isVisible = false;
            tracks.forEach(track => {
              track.style.transition = 'opacity 0.3s ease-in-out';
              track.style.opacity = '0.7';
              // Delay the pause to allow fade transition
              setTimeout(() => {
                // Ensure the carousel is still not visible before pausing
                if (!entry.isIntersecting) {
                  track.style.animationPlayState = 'paused';
                }
              }, 300);
            });
          }
        }
      });
    }, {
      threshold: 0.2, // Slightly higher threshold for better UX
      rootMargin: '50px' // Start animation before element is fully visible
    });

    observer.observe(carousel);

    // Handle page visibility changes for better performance
    if (typeof document.visibilityState !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const tracks = carousel.querySelectorAll('.partners-track');
        if (document.hidden) {
          tracks.forEach(track => {
            track.style.animationPlayState = 'paused';
          });
        } else if (isVisible) {
          tracks.forEach(track => {
            track.style.animationPlayState = 'running';
          });
        }
      });
    }
  }

  /**
   * Public method to refresh the carousel (useful for dynamic updates)
   */
  async refresh() {
    await this.loadPartnerLogos();
    this.populateTracks();
  }

  /**
   * Fallback for browsers with poor CSS animation support
   */
  setupFallbackAnimation() {
    // Check if CSS animations are supported
    const testElement = document.createElement('div');
    testElement.style.animation = 'test 1s';
    
    if (!testElement.style.animation) {
      console.warn('CSS animations not supported, using JavaScript fallback');
      this.useJavaScriptAnimation();
      return;
    }

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log('Reduced motion preferred, using static layout');
      this.useStaticLayout();
      return;
    }
  }

  /**
   * JavaScript-based animation fallback
   */
  useJavaScriptAnimation() {
    const tracks = [this.track1, this.track2];
    
    tracks.forEach((track, index) => {
      if (!track) return;
      
      let position = 0;
      const speed = index === 0 ? 1 : 1.1; // Different speeds for variety
      
      const animate = () => {
        position -= speed;
        const trackWidth = track.scrollWidth / 2; // Half because we have duplicates
        
        if (Math.abs(position) >= trackWidth) {
          position = 0;
        }
        
        track.style.transform = `translate3d(${position}px, 0, 0)`;
        requestAnimationFrame(animate);
      };
      
      animate();
    });
  }

  /**
   * Static layout for accessibility
   */
  useStaticLayout() {
    const carousel = document.querySelector('.partners-carousel');
    if (carousel) {
      carousel.style.mask = 'none';
      carousel.style.webkitMask = 'none';
      carousel.style.overflowX = 'auto';
    }
    
    [this.track1, this.track2].forEach(track => {
      if (track) {
        track.style.animation = 'none';
        track.style.justifyContent = 'center';
        track.style.flexWrap = 'wrap';
      }
    });
  }
}

// Feature detection and polyfills
function checkBrowserSupport() {
  const features = {
    intersectionObserver: 'IntersectionObserver' in window,
    cssAnimations: CSS.supports('animation', 'test 1s'),
    translate3d: CSS.supports('transform', 'translate3d(0, 0, 0)'),
    fetch: 'fetch' in window
  };
  
  console.log('Browser feature support:', features);
  return features;
}

// Initialize the carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if the partners section exists
  if (document.querySelector('.partners-section')) {
    // Check browser support
    const support = checkBrowserSupport();
    
    if (!support.fetch) {
      console.warn('Fetch API not supported, carousel may not work properly');
    }
    
    try {
      new PartnersCarousel();
    } catch (error) {
      console.error('Failed to initialize partners carousel:', error);
      
      // Fallback: Show static logos
      const carousel = document.querySelector('.partners-carousel');
      if (carousel) {
        carousel.innerHTML = '<p style="text-align: center; color: #666;">Partner logos werden geladen...</p>';
      }
    }
  }
});

// Export for potential external use
window.PartnersCarousel = PartnersCarousel;
