/**
 * Projects Map Module
 * Interactive world map showing installed solar projects
 * Enhanced with detailed debugging
 */

class ProjectsMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.projects = [];
    this.debugMode = false; // Debug logging disabled for production
    this.loadAttempts = [];
    
    if (this.debugMode) {
      this.log('ProjectsMap instance created', { containerId });
    }
  }
  
  /**
   * Enhanced logging function
   */
  log(message, data = null) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[ProjectsMap ${timestamp}]`;
    
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
  
  /**
   * Show loading state
   */
  showLoading() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = `
        <div class="map-loading">
          <p>Karte wird geladen...</p>
          <div class="loading-spinner"></div>
        </div>
      `;
      this.log('Loading state displayed');
    }
  }

  /**
   * Initialize the map
   */
  async init() {
    this.log('=== MAP INITIALIZATION STARTED ===');
    this.showLoading();
    
    try {
      // Check Leaflet availability
      if (typeof L === 'undefined') {
        throw new Error('Leaflet library not loaded');
      }
      this.log('✓ Leaflet library available');
      
      // Load project data
      this.log('Loading project data...');
      await this.loadProjects();
      this.log(`✓ Loaded ${this.projects.length} projects`);

      // Clear loading state
      const container = document.getElementById(this.containerId);
      if (container) {
        container.innerHTML = '';
      }

      // Initialize map centered on Central Europe (DACH region)
      this.log('Initializing Leaflet map...');
      this.map = L.map(this.containerId, {
        center: [49.0, 10.0],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true
      });
      this.log('✓ Map initialized');

      // Add OpenStreetMap tiles
      this.log('Adding map tiles...');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(this.map);
      this.log('✓ Map tiles added');

      // Add markers for all projects
      this.log('Adding markers...');
      this.addMarkers();
      this.log(`✓ Added ${this.markers.length} markers`);

      // Fit bounds to show all markers
      if (this.markers.length > 0) {
        const group = new L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
        this.log('✓ Map bounds fitted to markers');
      }
      
      this.log('=== MAP INITIALIZATION COMPLETE ===');

    } catch (error) {
      this.log('✗ ERROR during initialization:', error);
      console.error('Map initialization error:', error);
      this.showError(error);
    }
  }

  /**
   * Load project data from JSON file with detailed debugging
   */
  async loadProjects() {
    const startTime = Date.now();
    
    try {
      // Determine base path
      const currentPath = window.location.pathname;
      this.log('Current page path:', currentPath);
      
      // Try multiple possible paths for the JSON file
      const possiblePaths = [
        '/data/projects-map.json',
        './data/projects-map.json',
        '../data/projects-map.json',
        'data/projects-map.json'
      ];

      this.log('Will try these paths:', possiblePaths);

      let data = null;
      let successfulPath = null;

      for (const path of possiblePaths) {
        const attemptStart = Date.now();
        
        try {
          this.log(`[Attempt] Fetching: ${path}`);
          
          const response = await fetch(path, {
            cache: 'no-cache',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          const attemptTime = Date.now() - attemptStart;
          
          this.loadAttempts.push({
            path,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            time: attemptTime
          });
          
          this.log(`[Response] ${path}:`, {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType: response.headers.get('content-type'),
            time: `${attemptTime}ms`
          });
          
          if (response.ok) {
            const text = await response.text();
            this.log(`[Content] Received ${text.length} characters`);
            
            try {
              data = JSON.parse(text);
              successfulPath = path;
              this.log(`✓ Successfully parsed JSON from: ${path}`);
              break;
            } catch (parseError) {
              this.log(`✗ JSON parse error from ${path}:`, parseError);
              this.log(`First 200 chars of response:`, text.substring(0, 200));
            }
          }
        } catch (err) {
          const attemptTime = Date.now() - attemptStart;
          this.loadAttempts.push({
            path,
            error: err.message,
            time: attemptTime
          });
          this.log(`✗ Fetch failed for ${path}:`, {
            error: err.message,
            time: `${attemptTime}ms`
          });
        }
      }

      if (!data || !data.projects) {
        const totalTime = Date.now() - startTime;
        this.log('=== ALL LOAD ATTEMPTS FAILED ===');
        this.log('Summary of attempts:', this.loadAttempts);
        this.log(`Total time: ${totalTime}ms`);
        
        throw new Error(
          `Failed to load project data after trying ${possiblePaths.length} paths. ` +
          `Check browser console for details.`
        );
      }

      const totalTime = Date.now() - startTime;
      this.projects = data.projects;
      
      this.log('=== PROJECT DATA LOADED SUCCESSFULLY ===');
      this.log(`Source: ${successfulPath}`);
      this.log(`Projects: ${this.projects.length}`);
      this.log(`Total load time: ${totalTime}ms`);
      
    } catch (error) {
      this.log('✗ CRITICAL ERROR loading projects:', error);
      throw error;
    }
  }

  /**
   * Add markers for all projects
   */
  addMarkers() {
    this.projects.forEach(project => {
      const marker = this.createMarker(project);
      this.markers.push(marker);
    });
  }

  /**
   * Create a marker for a project
   */
  createMarker(project) {
    // Custom icon with green color
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="marker-pin" style="background-color: var(--accent-color, #7FB069);"></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42],
      popupAnchor: [0, -42]
    });

    // Create marker
    const marker = L.marker([project.lat, project.lng], { icon })
      .addTo(this.map);

    // Create popup content with image support
    const popupContent = this.createPopupContent(project);
    
    // Bind popup with professional styling
    marker.bindPopup(popupContent, {
      maxWidth: 320,
      minWidth: 280,
      className: 'project-popup',
      closeButton: true,
      autoClose: true,
      closeOnClick: false
    });

    return marker;
  }

  /**
   * Create professional popup content with optional image
   */
  createPopupContent(project) {
    // Image section - show image if available, otherwise show placeholder
    let imageHTML = '';
    if (project.image) {
      imageHTML = `
        <div class="popup-image-container">
          <img 
            src="${this.escapeHtml(project.image)}" 
            alt="${this.escapeHtml(project.name)}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div class="popup-image-placeholder" style="display: none;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Bild nicht verfügbar</p>
          </div>
        </div>
      `;
    } else {
      imageHTML = `
        <div class="popup-image-container">
          <div class="popup-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Kein Bild verfügbar</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="project-popup-content">
        ${imageHTML}
        <div class="popup-info-section">
          <h3 class="project-popup-title">${this.escapeHtml(project.name)}</h3>
          <div class="popup-details-grid">
            <div class="popup-detail-box">
              <div class="popup-detail-label">Standort</div>
              <div class="popup-detail-value">${this.escapeHtml(project.city)}, ${this.escapeHtml(project.country)}</div>
            </div>
            <div class="popup-detail-box">
              <div class="popup-detail-label">Leistung</div>
              <div class="popup-detail-value">${this.escapeHtml(project.power)}</div>
            </div>
            <div class="popup-detail-box">
              <div class="popup-detail-label">Typ</div>
              <div class="popup-detail-value">${this.escapeHtml(project.type)}</div>
            </div>
            <div class="popup-detail-box">
              <div class="popup-detail-label">Jahr</div>
              <div class="popup-detail-value">${this.escapeHtml(project.year)}</div>
            </div>
          </div>
          <p class="project-popup-description">${this.escapeHtml(project.description)}</p>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show detailed error message
   */
  showError(error) {
    const container = document.getElementById(this.containerId);
    if (container) {
      let debugInfo = '';
      
      if (this.debugMode && this.loadAttempts.length > 0) {
        debugInfo = '<div class="map-error-debug"><h4>Debug Information:</h4><ul>';
        this.loadAttempts.forEach(attempt => {
          if (attempt.ok) {
            debugInfo += `<li>✓ ${attempt.path} - ${attempt.status} (${attempt.time}ms)</li>`;
          } else if (attempt.error) {
            debugInfo += `<li>✗ ${attempt.path} - Error: ${attempt.error}</li>`;
          } else {
            debugInfo += `<li>✗ ${attempt.path} - ${attempt.status} ${attempt.statusText}</li>`;
          }
        });
        debugInfo += '</ul>';
        debugInfo += `<p><strong>Current URL:</strong> ${window.location.href}</p>`;
        debugInfo += `<p><strong>Base Path:</strong> ${window.location.pathname}</p>`;
        debugInfo += '</div>';
      }
      
      container.innerHTML = `
        <div class="map-error">
          <h3>Karte konnte nicht geladen werden</h3>
          <p><strong>Fehler:</strong> ${error?.message || 'Unbekannter Fehler'}</p>
          <p>Bitte öffnen Sie die Browser-Konsole (F12) für Details.</p>
          ${debugInfo}
          <button onclick="location.reload()" class="btn btn-secondary" style="margin-top: 1rem;">
            Seite neu laden
          </button>
        </div>
      `;
      
      this.log('Error display shown with debug info');
    }
  }
}

// Initialize map when DOM is loaded and Leaflet is available
function initializeMap() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] initializeMap() called`);
  console.log('Document ready state:', document.readyState);
  console.log('Window location:', window.location.href);
  
  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    console.warn('⏳ Leaflet not loaded yet, retrying in 100ms...');
    setTimeout(initializeMap, 100);
    return;
  }
  console.log('✓ Leaflet is available, version:', L.version);

  const mapContainer = document.getElementById('projects-map');
  if (mapContainer) {
    console.log('✓ Map container #projects-map found');
    console.log('Container dimensions:', {
      width: mapContainer.offsetWidth,
      height: mapContainer.offsetHeight
    });
    
    const projectsMap = new ProjectsMap('projects-map');
    projectsMap.init().catch(err => {
      console.error('Failed to initialize map:', err);
    });
  } else {
    console.error('✗ Map container #projects-map not found in DOM');
    console.log('Available elements with "map" in ID:', 
      Array.from(document.querySelectorAll('[id*="map"]')).map(el => el.id)
    );
  }
}

// Start initialization when DOM is ready
console.log('=== Projects Map Script Loaded ===');
console.log('Script URL:', document.currentScript?.src || 'inline');

if (document.readyState === 'loading') {
  console.log('DOM still loading, waiting for DOMContentLoaded event...');
  document.addEventListener('DOMContentLoaded', initializeMap);
} else {
  console.log('DOM already loaded, initializing immediately...');
  initializeMap();
}
