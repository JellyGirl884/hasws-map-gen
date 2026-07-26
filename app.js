// Main application logic

class MapGenerator {
    constructor() {
        this.myLocation = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
        this.questions = [];
        this.excludedAreas = [];
        this.map = null;
        this.markers = {};
        this.excludedLayers = [];
        this.searchArea = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initMap();
        this.updateQuestionDetails();
    }

    setupEventListeners() {
        document.getElementById('setLocationBtn').addEventListener('click', () => this.setMyLocation());
        document.getElementById('addQuestionBtn').addEventListener('click', () => this.addQuestion());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('questionType').addEventListener('change', () => this.updateQuestionDetails());
    }

    initMap() {
        this.map = L.map('map').setView([this.myLocation.lat, this.myLocation.lng], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add my location marker
        this.updateMyLocationMarker();
    }

    setMyLocation() {
        const lat = parseFloat(document.getElementById('myLat').value);
        const lng = parseFloat(document.getElementById('myLng').value);

        if (isNaN(lat) || isNaN(lng)) {
            alert('Please enter valid coordinates');
            return;
        }

        this.myLocation = { lat, lng };
        this.updateMyLocationMarker();
        this.map.setView([lat, lng], 4);
    }

    updateMyLocationMarker() {
        if (this.markers.myLocation) {
            this.map.removeLayer(this.markers.myLocation);
        }
        this.markers.myLocation = L.circleMarker([this.myLocation.lat, this.myLocation.lng], {
            radius: 8,
            fillColor: '#667eea',
            color: '#333',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup('Your Location').addTo(this.map);
    }

    updateQuestionDetails() {
        const type = document.getElementById('questionType').value;
        const detailsDiv = document.getElementById('questionDetails');
        detailsDiv.innerHTML = '';

        const details = {
            matching: `
                <div class="input-group">
                    <label>Attribute to Compare</label>
                    <select id="matchingAttribute">
                        <option value="continent">Continent</option>
                        <option value="country">Country</option>
                        <option value="timezone">Time Zone</option>
                        <option value="language">Official Language</option>
                        <option value="religion">Dominant Religion</option>
                        <option value="script">Script</option>
                        <option value="firstLetter">First Letter of Country</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Answer: Same or Different?</label>
                    <select id="matchingAnswer">
                        <option value="same">Same</option>
                        <option value="different">Different</option>
                    </select>
                </div>
            `,
            measuring: `
                <div class="input-group">
                    <label>Metric to Compare</label>
                    <select id="measuringMetric">
                        <option value="population">Population</option>
                        <option value="gdp">GDP Per Capita</option>
                        <option value="area">Total Area</option>
                        <option value="density">Population Density</option>
                        <option value="hdi">Human Development Index</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Answer: Greater or Lesser?</label>
                    <select id="measuringAnswer">
                        <option value="greater">Greater</option>
                        <option value="lesser">Lesser</option>
                    </select>
                </div>
            `,
            thermometer: `
                <div class="input-group">
                    <label>Distance Traveled</label>
                    <select id="thermometerDistance">
                        <option value="1">1 mile</option>
                        <option value="5">5 miles</option>
                        <option value="10">10 miles</option>
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="100">100 miles</option>
                        <option value="200">200 miles</option>
                        <option value="500">500 miles</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Answer: Hotter or Colder?</label>
                    <select id="thermometerAnswer">
                        <option value="hotter">Hotter</option>
                        <option value="colder">Colder</option>
                    </select>
                </div>
            `,
            radar: `
                <div class="input-group">
                    <label>Distance Radius</label>
                    <select id="radarDistance">
                        <option value="5">5 miles</option>
                        <option value="10">10 miles</option>
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="100">100 miles</option>
                        <option value="250">250 miles</option>
                        <option value="500">500 miles</option>
                        <option value="1000">1000 miles</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Answer: Within or Outside?</label>
                    <select id="radarAnswer">
                        <option value="within">Within</option>
                        <option value="outside">Outside</option>
                    </select>
                </div>
            `,
            tentacles: `
                <div class="input-group">
                    <label>Place Type</label>
                    <select id="tentaclesPlace">
                        <option value="hotel">Hotel</option>
                        <option value="library">Library</option>
                        <option value="hospital">Hospital</option>
                        <option value="museum">Museum</option>
                        <option value="theater">Movie Theater</option>
                        <option value="aquarium">Aquarium</option>
                        <option value="park">Theme Park</option>
                        <option value="zoo">Zoo</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Distance Range</label>
                    <select id="tentaclesDistance">
                        <option value="5">5 miles</option>
                        <option value="10">10 miles</option>
                        <option value="20">20 miles</option>
                        <option value="50">50 miles</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Which Place Was Closest?</label>
                    <input type="text" id="tentaclesAnswer" placeholder="e.g., Hotel">
                </div>
            `
        };

        if (details[type]) {
            detailsDiv.innerHTML = details[type];
        }
    }

    addQuestion() {
        const type = document.getElementById('questionType').value;
        const hiderLat = parseFloat(document.getElementById('hiderLat').value);
        const hiderLng = parseFloat(document.getElementById('hiderLng').value);

        if (isNaN(hiderLat) || isNaN(hiderLng)) {
            alert('Please enter valid hider coordinates');
            return;
        }

        const question = {
            type,
            hiderLocation: { lat: hiderLat, lng: hiderLng },
            details: this.getQuestionDetails(type),
            timestamp: new Date().toLocaleTimeString()
        };

        this.questions.push(question);
        this.updateExcludedAreas();
        this.renderQuestionsList();
        this.updateStats();
        this.clearQuestionForm();
    }

    getQuestionDetails(type) {
        const details = {};
        switch (type) {
            case 'matching':
                details.attribute = document.getElementById('matchingAttribute').value;
                details.answer = document.getElementById('matchingAnswer').value;
                break;
            case 'measuring':
                details.metric = document.getElementById('measuringMetric').value;
                details.answer = document.getElementById('measuringAnswer').value;
                break;
            case 'thermometer':
                details.distance = document.getElementById('thermometerDistance').value;
                details.answer = document.getElementById('thermometerAnswer').value;
                break;
            case 'radar':
                details.distance = document.getElementById('radarDistance').value;
                details.answer = document.getElementById('radarAnswer').value;
                break;
            case 'tentacles':
                details.place = document.getElementById('tentaclesPlace').value;
                details.distance = document.getElementById('tentaclesDistance').value;
                details.answer = document.getElementById('tentaclesAnswer').value;
                break;
        }
        return details;
    }

    updateExcludedAreas() {
        // Clear previous excluded areas from map
        this.excludedLayers.forEach(layer => this.map.removeLayer(layer));
        this.excludedLayers = [];

        // Process each question and visualize exclusions
        this.questions.forEach((q, idx) => {
            const hiderLoc = q.hiderLocation;
            const myLoc = this.myLocation;
            const distance = this.calculateDistance(myLoc, hiderLoc);

            let excludedCircle;

            if (q.type === 'radar') {
                const radiusKm = parseFloat(q.details.distance) * 1.60934; // Convert miles to km
                if (q.details.answer === 'within') {
                    // If within, draw the within circle in light green
                    excludedCircle = L.circle(myLoc, {
                        radius: radiusKm * 1000,
                        color: '#48bb78',
                        weight: 2,
                        opacity: 0.6,
                        fillOpacity: 0.15,
                        fillColor: '#48bb78',
                        dashArray: '5, 5'
                    }).addTo(this.map);
                    excludedCircle.bindPopup(`Q${idx + 1}: Search area - Within ${q.details.distance} miles`);
                } else {
                    // If outside, draw exclusion circle in blue
                    excludedCircle = L.circle(myLoc, {
                        radius: radiusKm * 1000,
                        color: '#667eea',
                        weight: 2,
                        opacity: 0.6,
                        fillOpacity: 0.3,
                        fillColor: '#667eea'
                    }).addTo(this.map);
                    excludedCircle.bindPopup(`Q${idx + 1}: Excluded - Outside ${q.details.distance} miles`);
                }
                this.excludedLayers.push(excludedCircle);
            }

            // Add hider location marker
            const marker = L.circleMarker([hiderLoc.lat, hiderLoc.lng], {
                radius: 5,
                fillColor: '#f56565',
                color: '#c53030',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            }).bindPopup(`Q${idx + 1} Location`).addTo(this.map);
            this.excludedLayers.push(marker);
        });
    }

    calculateDistance(point1, point2) {
        const R = 3959; // Earth's radius in miles
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    renderQuestionsList() {
        const list = document.getElementById('questionsList');
        list.innerHTML = '';

        this.questions.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'question-item';
            
            let details = '';
            switch (q.type) {
                case 'matching':
                    details = `${q.details.attribute} - ${q.details.answer}`;
                    break;
                case 'measuring':
                    details = `${q.details.metric} - ${q.details.answer}`;
                    break;
                case 'thermometer':
                    details = `${q.details.distance} miles - ${q.details.answer}`;
                    break;
                case 'radar':
                    details = `Within ${q.details.distance} miles? ${q.details.answer}`;
                    break;
                case 'tentacles':
                    details = `Closest: ${q.details.answer}`;
                    break;
            }

            item.innerHTML = `
                <strong>Q${idx + 1}: ${q.type.toUpperCase()}</strong>
                <div>${details}</div>
                <small>${q.timestamp}</small>
                <button class="remove-btn" onclick="app.removeQuestion(${idx})">✕</button>
            `;
            list.appendChild(item);
        });
    }

    removeQuestion(index) {
        this.questions.splice(index, 1);
        this.updateExcludedAreas();
        this.renderQuestionsList();
        this.updateStats();
    }

    clearQuestionForm() {
        document.getElementById('hiderLat').value = '';
        document.getElementById('hiderLng').value = '';
    }

    updateStats() {
        document.getElementById('questionCount').textContent = this.questions.length;
        
        let minRadius = Infinity;
        this.questions.forEach(q => {
            if (q.type === 'radar' && q.details.answer === 'within') {
                const radius = parseFloat(q.details.distance);
                minRadius = Math.min(minRadius, radius);
            }
        });
        
        if (minRadius !== Infinity) {
            document.getElementById('searchRadius').textContent = `${minRadius.toFixed(1)} miles`;
            const area = Math.PI * minRadius * minRadius;
            document.getElementById('searchArea').textContent = `${area.toFixed(0)} sq miles`;
        } else {
            document.getElementById('searchRadius').textContent = 'Unlimited';
            document.getElementById('searchArea').textContent = 'Unlimited';
        }
    }

    clearAll() {
        if (confirm('Clear all questions? This cannot be undone.')) {
            this.questions = [];
            this.updateExcludedAreas();
            this.renderQuestionsList();
            this.updateStats();
        }
    }

    exportData() {
        const data = {
            myLocation: this.myLocation,
            questions: this.questions,
            exportTime: new Date().toISOString()
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hs-map-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize app
const app = new MapGenerator();
