/**
 * Royal Store - Modern Store Locator Application
 * Developed with Leaflet & 100% Free OpenStreetMap Tiles (No API Key Required)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- State ---
  let map;
  let markerCluster;
  let markersById = {};
  let userLocation = null;
  let userMarker = null;
  let userAccuracyCircle = null;
  let activeRadiusCircle = null;

  let currentCategory = 'all';
  let currentDivision = 'all';
  let searchQuery = '';
  let maxRadiusKm = 100;
  let sortBy = 'default';

  // --- DOM Elements ---
  const storeListEl = document.getElementById('storeList');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const divisionFilter = document.getElementById('divisionFilter');
  const categoryPills = document.querySelectorAll('.category-pill');
  const nearMeBtn = document.getElementById('nearMeBtn');
  const radiusContainer = document.getElementById('radiusContainer');
  const radiusSlider = document.getElementById('radiusSlider');
  const radiusValueText = document.getElementById('radiusValue');
  const resultsCountText = document.getElementById('resultsCount');
  const sortSelect = document.getElementById('sortSelect');
  const emptyState = document.getElementById('emptyState');
  const resetViewBtn = document.getElementById('resetViewBtn');
  const locateMeMapBtn = document.getElementById('locateMeMapBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarHeader = document.querySelector('.sidebar-header');

  // --- 1. Initialize Map ---
  function initMap() {
    // Center of Bangladesh: Lat ~23.81, Lng ~90.41
    map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([23.8103, 90.4125], 7);

    // Map attribution prefix with Royal Technologies credits
    map.attributionControl.setPrefix('<a href="https://www.royaltechbd.com/" target="_blank" rel="noopener" style="font-weight:700; color:#047857;">Royal Technologies</a> &middot; <a href="https://leafletjs.com" target="_blank">Leaflet</a>');

    // Zoom control at top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // 100% Free OpenStreetMap & Open-Source Tile Layers (Zero Watermark, Zero API Key)
    const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    const osmHumanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Tiles by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OSM Team</a>',
      maxZoom: 19
    });

    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri, USGS, NOAA',
      maxZoom: 19
    });

    const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17
    });

    // Default layer: OpenStreetMap Standard
    openStreetMap.addTo(map);

    // Layer Switcher Control
    const baseMaps = {
      "OpenStreetMap (Standard)": openStreetMap,
      "OpenStreetMap (HOT Style)": osmHumanitarian,
      "Satellite Imagery (Esri)": esriSatellite,
      "Topographic Map (OpenTopo)": openTopoMap
    };
    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

    // Initialize Marker Cluster Group
    markerCluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: #fff;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(4, 120, 87, 0.45);
            border: 2px solid #ffffff;
          ">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: [38, 38]
        });
      }
    });

    map.addLayer(markerCluster);

    // Safety check: ensure popup never touches or overflows the top of the map
    map.on('popupopen', (e) => {
      if (!e.popup) return;
      const el = e.popup.getElement();
      if (!el) return;
      const mapBox = map.getContainer().getBoundingClientRect();
      const popupBox = el.getBoundingClientRect();
      const topGap = popupBox.top - mapBox.top;
      if (topGap < 75) {
        map.panBy([0, topGap - 95], { animate: true, duration: 0.25 });
      }
    });

    // Populate Division Dropdown
    populateDivisionOptions();

    // Render Initial Store Pins & Cards
    renderStores();

    // Fit map bounds to all stores
    fitAllStoresBounds();
  }

  // --- 2. Populate Division Options Dynamically ---
  function populateDivisionOptions() {
    const divisions = [...new Set(ROYAL_STORES.map(s => s.division))].sort();
    divisions.forEach(div => {
      const option = document.createElement('option');
      option.value = div;
      option.textContent = `${div} Division (${ROYAL_STORES.filter(s => s.division === div).length})`;
      divisionFilter.appendChild(option);
    });
  }

  // --- 3. Custom Map Pin Creation ---
  function createCustomPin(store) {
    let pinClass = 'pin-dealer';
    let iconName = 'fa-store';

    if (store.category === 'flagship') {
      pinClass = 'pin-flagship';
      iconName = 'fa-star';
    } else if (store.category === 'corporate') {
      pinClass = 'pin-corporate';
      iconName = 'fa-building';
    }

    return L.divIcon({
      className: `custom-pin ${pinClass}`,
      html: `
        <div class="pin-icon-wrap" title="${escapeHtml(store.name)}">
          <i class="fa-solid ${iconName}"></i>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -38]
    });
  }

  // --- 4. Custom Popup HTML ---
  function createPopupContent(store) {
    const badgeClass = store.category === 'flagship' ? 'type-flagship' :
                       store.category === 'corporate' ? 'type-corporate' : 'type-dealer';

    const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    const phoneClean = store.phone.split(',')[0].replace(/[^0-9]/g, '');

    return `
      <div class="popup-card">
        <div class="popup-header-banner">
          <span class="popup-badge ${badgeClass}">${store.type}</span>
          <h4 class="popup-title">${escapeHtml(store.name)}</h4>
        </div>
        <div class="popup-body">
          <div class="popup-item">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(store.address)}</span>
          </div>
          <div class="popup-item">
            <i class="fa-solid fa-phone"></i>
            <a href="tel:${phoneClean}">${store.phone}</a>
          </div>
          <div class="popup-item">
            <i class="fa-regular fa-clock"></i>
            <span>${store.hours}</span>
          </div>
        </div>
        <div class="popup-footer">
          <a href="tel:${phoneClean}" class="popup-btn btn-call"><i class="fa-solid fa-phone"></i> Call Now</a>
          <a href="${dirUrl}" target="_blank" rel="noopener" class="popup-btn btn-primary"><i class="fa-solid fa-diamond-turn-right"></i> Directions</a>
        </div>
      </div>
    `;
  }

  // --- 5. Haversine Distance Calculation (KM) ---
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- 6. Filter & Sort Logic ---
  function getFilteredStores() {
    let list = ROYAL_STORES.map(store => {
      let dist = null;
      if (userLocation) {
        dist = calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng);
      }
      return { ...store, distance: dist };
    });

    // 1. Category Filter
    if (currentCategory !== 'all') {
      list = list.filter(s => s.category === currentCategory);
    }

    // 2. Division Filter
    if (currentDivision !== 'all') {
      list = list.filter(s => s.division.toLowerCase() === currentDivision.toLowerCase());
    }

    // 3. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        s.division.toLowerCase().includes(q) ||
        s.contact_person.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    }

    // 4. Radius Filter (when user location is active)
    if (userLocation && maxRadiusKm < 150) {
      list = list.filter(s => s.distance !== null && s.distance <= maxRadiusKm);
    }

    // 5. Sorting
    if (sortBy === 'distance' && userLocation) {
      list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // Default: If user location active, sort by nearest; else Flagships first
      if (userLocation) {
        list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      } else {
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }
    }

    return list;
  }

  // --- 7. Render Function ---
  function renderStores() {
    const stores = getFilteredStores();

    // Clear marker cluster
    markerCluster.clearLayers();
    markersById = {};
    storeListEl.innerHTML = '';

    // Update results count
    resultsCountText.textContent = stores.length === 1 
      ? '1 Showroom Found' 
      : `${stores.length} Showrooms Found`;

    if (stores.length === 0) {
      emptyState.style.display = 'flex';
      return;
    } else {
      emptyState.style.display = 'none';
    }

    // Add pins to map and cards to list
    stores.forEach(store => {
      // Pin
      const pinIcon = createCustomPin(store);
      const marker = L.marker([store.lat, store.lng], { icon: pinIcon });
      marker.bindPopup(createPopupContent(store), {
        maxWidth: 290,
        minWidth: 260,
        autoPan: true,
        autoPanPaddingTopLeft: [20, 90],
        autoPanPaddingBottomRight: [20, 20]
      });

      marker.on('click', () => {
        highlightCard(store.id);
      });

      markerCluster.addLayer(marker);
      markersById[store.id] = marker;

      // Card
      const card = createStoreCardElement(store);
      storeListEl.appendChild(card);
    });
  }

  // --- 8. Create Store Card DOM Element ---
  function createStoreCardElement(store) {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.id = `card-${store.id}`;

    const badgeClass = store.category === 'flagship' ? 'type-flagship' :
                       store.category === 'corporate' ? 'type-corporate' : 'type-dealer';

    const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;
    const phoneClean = store.phone.split(',')[0].replace(/[^0-9]/g, '');

    const distanceHtml = store.distance !== null
      ? `<span class="distance-badge"><i class="fa-solid fa-location-arrow"></i> ${store.distance.toFixed(1)} km away</span>`
      : '';

    card.innerHTML = `
      <div class="card-header-row">
        <div class="card-title-group">
          <span class="store-type-badge ${badgeClass}">${store.type}</span>
          <h3 class="store-title">${escapeHtml(store.name)}</h3>
        </div>
        ${distanceHtml}
      </div>

      <div class="card-details">
        <div class="detail-item">
          <i class="fa-solid fa-location-dot"></i>
          <span>${escapeHtml(store.address)}</span>
        </div>
        <div class="detail-item">
          <i class="fa-solid fa-user-tie"></i>
          <span>${escapeHtml(store.contact_person)}</span>
        </div>
        <div class="detail-item">
          <i class="fa-solid fa-phone"></i>
          <a href="tel:${phoneClean}" class="detail-link" onclick="event.stopPropagation()">${store.phone}</a>
        </div>
        <div class="detail-item">
          <i class="fa-regular fa-clock"></i>
          <span class="status-indicator">
            <span class="status-dot"></span>
            ${store.hours}
          </span>
        </div>
      </div>

      <div class="card-actions">
        <button class="card-btn btn-secondary view-map-btn" data-id="${store.id}">
          <i class="fa-solid fa-map-location-dot"></i> View on Map
        </button>
        <a href="${dirUrl}" target="_blank" rel="noopener" class="card-btn btn-primary" onclick="event.stopPropagation()">
          <i class="fa-solid fa-diamond-turn-right"></i> Directions
        </a>
      </div>
    `;

    // Click card to zoom and open popup on single click
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      focusOnStore(store.id);
    });

    card.querySelector('.view-map-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      focusOnStore(store.id);
    });

    return card;
  }

  // --- 9. Focus on Store (Single Click Immediate Response) ---
  function focusOnStore(storeId) {
    const store = ROYAL_STORES.find(s => s.id === storeId);
    const marker = markersById[storeId];

    if (!store || !marker) return;

    // Highlight active card immediately
    highlightCard(storeId);

    // Offset latitude slightly north (+0.0032) so the pin is positioned lower in the viewport,
    // giving plenty of space above the pin so the popup is never cut off at the top
    const offsetLat = store.lat + 0.0032;
    const targetZoom = Math.max(map.getZoom(), 15);

    // Reveal marker from any cluster, position map, and open popup on 1 click
    markerCluster.zoomToShowLayer(marker, () => {
      map.setView([offsetLat, store.lng], targetZoom, { animate: false });
      marker.openPopup();
    });

    // If mobile, close sidebar drawer slightly so map is visible
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('expanded');
    }
  }

  function highlightCard(storeId) {
    document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
    const targetCard = document.getElementById(`card-${storeId}`);
    if (targetCard) {
      targetCard.classList.add('active');
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // --- 10. Fit All Stores Bounds ---
  function fitAllStoresBounds() {
    if (ROYAL_STORES.length === 0) return;
    const group = L.featureGroup(Object.values(markersById));
    if (group.getLayers().length > 0) {
      map.fitBounds(group.getBounds().pad(0.12));
    } else {
      map.setView([23.8103, 90.4125], 7);
    }
  }

  // --- 11. Geolocation ("Near Me") Handler (Dual GPS + Instant IP Fallback) ---
  function handleGeolocation() {
    nearMeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
    locateMeMapBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    function onLocationSuccess(lat, lng, accuracy, label) {
      userLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        accuracy: accuracy || 1000
      };

      nearMeBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Near Me';
      nearMeBtn.classList.add('active');
      locateMeMapBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';

      // Show radius filter slider
      radiusContainer.classList.add('visible');

      // Set default sort to distance
      sortBy = 'distance';
      sortSelect.value = 'distance';

      // Add or update User Location marker
      updateUserLocationMarker(label);

      // Render stores sorted by distance
      renderStores();

      // Zoom to user location
      map.flyTo([userLocation.lat, userLocation.lng], 13, {
        duration: 1.2
      });

      showToast(`📍 Location found: ${label || 'Near you'} (Nearest stores sorted)`);
    }

    function fallbackIpLocation() {
      // Free IP Geolocation via ipwho.is (fast, reliable, CORS enabled)
      fetch('https://ipwho.is/')
        .then(res => res.json())
        .then(data => {
          if (data && data.success !== false && data.latitude && data.longitude) {
            const cityName = data.city || data.region || 'Dhaka';
            onLocationSuccess(data.latitude, data.longitude, 2500, cityName);
          } else {
            throw new Error('ipwho invalid response');
          }
        })
        .catch(() => {
          // Backup fallback: freeipapi.com
          fetch('https://freeipapi.com/api/json')
            .then(res => res.json())
            .then(data => {
              if (data && data.latitude && data.longitude) {
                const cityName = data.cityName || 'Dhaka';
                onLocationSuccess(data.latitude, data.longitude, 3000, cityName);
              } else {
                throw new Error('freeipapi invalid');
              }
            })
            .catch(() => {
              nearMeBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Near Me';
              locateMeMapBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
              showToast('Could not detect location. Please choose a division from the dropdown.');
            });
        });
    }

    // Try browser geolocation first with quick 3s timeout
    if (navigator.geolocation && location.protocol !== 'file:') {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onLocationSuccess(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            'Your Location'
          );
        },
        (err) => {
          console.warn('Browser GPS unavailable, using IP geolocation fallback...', err);
          fallbackIpLocation();
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
      );
    } else {
      // When opened as file:// or if browser lacks geolocation
      fallbackIpLocation();
    }
  }

  function updateUserLocationMarker(label) {
    if (!userLocation) return;

    if (userMarker) {
      map.removeLayer(userMarker);
    }
    if (userAccuracyCircle) {
      map.removeLayer(userAccuracyCircle);
    }
    if (activeRadiusCircle) {
      map.removeLayer(activeRadiusCircle);
    }

    // User pin icon
    const userPinIcon = L.divIcon({
      className: 'user-location-pin',
      html: '<div class="user-location-pulse"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const popupText = label 
      ? `<b>${escapeHtml(label)}</b><br>Searching for nearest Royal Stores from here`
      : '<b>Your Current Location</b><br>Searching for nearest Royal Stores from here';

    userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userPinIcon, zIndexOffset: 10000 })
      .bindPopup(popupText)
      .addTo(map);

    // Accuracy Circle
    userAccuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
      radius: Math.min(userLocation.accuracy || 1000, 3000),
      color: '#047857',
      fillColor: '#059669',
      fillOpacity: 0.1,
      weight: 1
    }).addTo(map);

    // Radius Circle if set
    if (maxRadiusKm < 150) {
      activeRadiusCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: maxRadiusKm * 1000,
        color: '#047857',
        fillColor: '#059669',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(map);
    }
  }

  // --- 12. Toast Notification ---
  function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast-msg';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // --- 13. Event Listeners ---

  // Live Search with debounce
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderStores();
    }, 200);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderStores();
    searchInput.focus();
  });

  // Division Filter
  divisionFilter.addEventListener('change', (e) => {
    currentDivision = e.target.value;
    renderStores();
    fitAllStoresBounds();
  });

  // Category Pills
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-category');
      renderStores();
    });
  });

  // Near Me Buttons
  nearMeBtn.addEventListener('click', handleGeolocation);
  locateMeMapBtn.addEventListener('click', handleGeolocation);

  // Radius Slider
  radiusSlider.addEventListener('input', (e) => {
    maxRadiusKm = parseInt(e.target.value);
    radiusValueText.textContent = maxRadiusKm >= 150 ? 'Unlimited' : `${maxRadiusKm} km`;
    if (activeRadiusCircle && userLocation) {
      activeRadiusCircle.setRadius(maxRadiusKm * 1000);
    }
    renderStores();
  });

  // Sort Select
  sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderStores();
  });

  // Reset Map View
  resetViewBtn.addEventListener('click', () => {
    fitAllStoresBounds();
    showToast('Showing all showrooms in Bangladesh');
  });

  // Fullscreen Toggle
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
    } else {
      document.exitFullscreen();
      fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
    }
  });

  // Desktop Sidebar Collapse / Expand Toggle
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
  const appContainer = document.querySelector('.app-container');

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed');
      appContainer.classList.toggle('sidebar-hidden', isCollapsed);

      if (isCollapsed) {
        sidebarToggleIcon.className = 'fa-solid fa-chevron-right';
        sidebarToggleBtn.setAttribute('title', 'Show sidebar');
      } else {
        sidebarToggleIcon.className = 'fa-solid fa-chevron-left';
        sidebarToggleBtn.setAttribute('title', 'Hide sidebar');
      }

      // Smoothly resize map after transition completes
      setTimeout(() => {
        map.invalidateSize();
      }, 320);
    });
  }

  // Mobile Drawer Toggle
  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('expanded');
    });
  }

  if (sidebarHeader && window.innerWidth <= 768) {
    sidebarHeader.addEventListener('click', () => {
      sidebar.classList.toggle('expanded');
    });
  }

  // Utility Helper
  function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      })[s];
    });
  }

  // --- 14. Initialize App ---
  initMap();
});
