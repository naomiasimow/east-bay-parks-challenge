class EBRPTracker {
    constructor() {
        this.map = null;
        this.markers = {};
        this.polygons = {};
        this.parkBoundaries = null;
        this.visitedParks = new Set();
        this.currentSort = 'alphabetical';
        this.init();
    }

    async init() {
        this.initMap();
        this.loadVisitedParks();
        await this.loadParkBoundaries();
        this.createParkPolygons();
        this.createParkMarkers();
        this.renderParkList();
        this.setupEventListeners();
        this.updateStats();
    }

    initMap() {
        this.map = L.map('map').setView([37.8, -122.1], 10);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
    }

    async loadParkBoundaries() {
        try {
            const response = await fetch('./east_bay_parks_boundaries.geojson');
            this.parkBoundaries = await response.json();
            console.log('Loaded park boundaries:', this.parkBoundaries.features.length, 'features');
        } catch (error) {
            console.warn('Could not load park boundaries:', error);
            this.parkBoundaries = null;
        }
    }

    createParkPolygons() {
        if (!this.parkBoundaries) return;

        this.parkBoundaries.features.forEach(feature => {
            const officialName = feature.properties.OFFICIAL_NAME;
            const park = parksData.find(p => p.name === officialName);

            if (park) {
                const isVisited = this.visitedParks.has(park.id);
                const color = isVisited ? '#1B4D3E' : '#4CAF50';

                const polygon = L.geoJSON(feature, {
                    style: {
                        color: color,
                        weight: 2,
                        opacity: 0.8,
                        fillColor: color,
                        fillOpacity: 0.3
                    }
                }).addTo(this.map);

                polygon.bindPopup(this.createPopupContent(park));

                polygon.on('mouseover', (e) => {
                    e.target.setStyle({
                        weight: 3,
                        fillOpacity: 0.5
                    });
                });

                polygon.on('mouseout', (e) => {
                    e.target.setStyle({
                        weight: 2,
                        fillOpacity: 0.3
                    });
                });

                polygon.on('click', () => {
                    this.toggleParkVisit(park.id);
                });

                this.polygons[park.id] = polygon;
            }
        });
    }

    createParkMarkers() {
        parksData.forEach(park => {
            // Only create markers for parks without polygon boundaries
            if (!this.polygons[park.id]) {
                const isVisited = this.visitedParks.has(park.id);
                const icon = this.createParkIcon(isVisited);

                const marker = L.marker([park.lat, park.lng], { icon })
                    .addTo(this.map)
                    .bindPopup(this.createPopupContent(park));

                // Remove hover popup behavior for markers too

                marker.on('click', () => {
                    this.toggleParkVisit(park.id);
                });

                this.markers[park.id] = marker;
            }
        });
    }

    createParkIcon(visited = false) {
        const color = visited ? '#1B4D3E' : '#4CAF50';

        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background-color: ${color};
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    }

    createPopupContent(park) {
        return `
            <div class="park-popup">
                <h3>${park.name}</h3>
                <p><strong>City:</strong> ${park.city}</p>
                <p><strong>County:</strong> ${park.county}</p>
                <p><strong>Size:</strong> ${park.acres} acres</p>
                <p><strong>Description:</strong> ${park.description}</p>
                <div class="popup-buttons">
                    <button onclick="tracker.toggleParkVisit(${park.id})" class="visit-btn">
                        ${this.visitedParks.has(park.id) ? 'Mark as Not Visited' : 'Mark as Visited'}
                    </button>
                    <a href="${park.website}" target="_blank" class="website-btn">Visit Website</a>
                </div>
            </div>
        `;
    }

    renderParkList() {
        const parkListContainer = document.getElementById('park-list');
        const sortedParks = this.getSortedParks();

        parkListContainer.innerHTML = sortedParks.map(park => `
            <div class="park-item">
                <label class="park-checkbox">
                    <input
                        type="checkbox"
                        id="park-${park.id}"
                        ${this.visitedParks.has(park.id) ? 'checked' : ''}
                        onchange="tracker.toggleParkVisit(${park.id})"
                    >
                    <span class="checkmark"></span>
                    <span class="park-name">${park.name}</span>
                    <span class="park-city">(${park.city})</span>
                </label>
            </div>
        `).join('');
    }

    getSortedParks() {
        const parks = [...parksData];

        if (this.currentSort === 'alphabetical') {
            return parks.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.currentSort === 'city') {
            return parks.sort((a, b) => {
                if (a.city === b.city) {
                    return a.name.localeCompare(b.name);
                }
                return a.city.localeCompare(b.city);
            });
        } else if (this.currentSort === 'visited') {
            return parks.sort((a, b) => {
                const aVisited = this.visitedParks.has(a.id);
                const bVisited = this.visitedParks.has(b.id);

                // Sort visited parks first
                if (aVisited && !bVisited) return -1;
                if (!aVisited && bVisited) return 1;

                // Within each group, sort alphabetically
                return a.name.localeCompare(b.name);
            });
        }

        return parks;
    }

    toggleParkVisit(parkId) {
        if (this.visitedParks.has(parkId)) {
            this.visitedParks.delete(parkId);
        } else {
            this.visitedParks.add(parkId);
        }

        this.updateMarker(parkId);
        this.updateCheckbox(parkId);
        this.saveVisitedParks();
        this.updateStats();
        this.updatePopupContent(parkId);
    }

    updateMarker(parkId) {
        const isVisited = this.visitedParks.has(parkId);
        const color = isVisited ? '#1B4D3E' : '#4CAF50';

        // Update polygon if it exists
        if (this.polygons[parkId]) {
            this.polygons[parkId].setStyle({
                color: color,
                fillColor: color
            });
        }

        // Update marker if it exists
        if (this.markers[parkId]) {
            const newIcon = this.createParkIcon(isVisited);
            this.markers[parkId].setIcon(newIcon);
        }
    }

    updateCheckbox(parkId) {
        const checkbox = document.getElementById(`park-${parkId}`);
        if (checkbox) {
            checkbox.checked = this.visitedParks.has(parkId);
        }
    }

    updatePopupContent(parkId) {
        const park = parksData.find(p => p.id === parkId);
        const content = this.createPopupContent(park);

        // Update polygon popup if it exists
        if (this.polygons[parkId]) {
            this.polygons[parkId].setPopupContent(content);
        }

        // Update marker popup if it exists
        if (this.markers[parkId]) {
            this.markers[parkId].setPopupContent(content);
        }
    }

    updateStats() {
        const visitedCount = this.visitedParks.size;
        const totalCount = parksData.length;
        const percentage = Math.round((visitedCount / totalCount) * 100);

        document.getElementById('visited-count').textContent = visitedCount;
        document.getElementById('total-count').textContent = totalCount;
        document.getElementById('percentage').textContent = `${percentage}%`;
    }

    setupEventListeners() {
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderParkList();
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all visited parks?')) {
                this.clearAllVisits();
            }
        });

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportProgress();
        });
    }

    clearAllVisits() {
        this.visitedParks.clear();

        // Update all markers and polygons
        [...Object.keys(this.markers), ...Object.keys(this.polygons)].forEach(parkId => {
            this.updateMarker(parseInt(parkId));
        });

        this.renderParkList();
        this.saveVisitedParks();
        this.updateStats();
    }

    exportProgress() {
        const visitedParkDetails = parksData
            .filter(park => this.visitedParks.has(park.id))
            .map(park => ({
                name: park.name,
                city: park.city,
                county: park.county,
                acres: park.acres
            }));

        const exportData = {
            totalParks: parksData.length,
            visitedCount: this.visitedParks.size,
            percentage: Math.round((this.visitedParks.size / parksData.length) * 100),
            exportDate: new Date().toISOString().split('T')[0],
            visitedParks: visitedParkDetails
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ebrp-progress-${exportData.exportDate}.json`;
        link.click();
    }

    saveVisitedParks() {
        localStorage.setItem('ebrp-visited-parks', JSON.stringify(Array.from(this.visitedParks)));
    }

    loadVisitedParks() {
        const saved = localStorage.getItem('ebrp-visited-parks');
        if (saved) {
            this.visitedParks = new Set(JSON.parse(saved));
        }
    }
}

let tracker;

document.addEventListener('DOMContentLoaded', () => {
    tracker = new EBRPTracker();
});