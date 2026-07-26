// Main application logic

class MapGenerator {
    constructor() {
        this.myLocation = { lat: 40.7128, lng: -74.0060 }; // Default to NYC
        this.questions = [];
        this.map = null;
        this.markers = {};
        this.layers = {
            searchArea: null,
            excluded: []
        };
        
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
        }).bindPopup('📍 Your Location').addTo(this.map);
    }

    updateQuestionDetails() {
        const type = document.getElementById('questionType').value;
        const detailsDiv = document.getElementById('questionDetails');
        detailsDiv.innerHTML = '';

        const details = {
            radar: `
                <div class="input-group">
                    <label>Distance Radius (miles)</label>
                    <select id="radarDistance">
                        <option value="5">5 miles</option>
                        <option value="10">10 miles</option>
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="100">100 miles</option>
                        <option value="250">250 miles</option>
                        <option value="500">500 miles</option>
                        <option value="1000">1000 miles</option>
                        <option value="2500">2500 miles</option>
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
            matching: `
                <div class="input-group">
                    <label>Attribute to Compare</label>
                    <select id="matchingAttribute">
                        <option value="continent">Continent</option>
                        <option value="country">Country</option>
                        <option value="timezone">Time Zone</option>
                        <option value="language">Official Language</option>
                        <option value="religion">Dominant Religion</option>
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

        const question = {
            type,
            details: this.getQuestionDetails(type),
            timestamp: new Date().toLocaleTimeString()
        };

        if (!question.details) {
            alert('Please fill in all fields');
            return;
        }

        this.questions.push(question);
        this.updateMap();
        this.renderQuestionsList();
        this.updateStats();
        this.clearQuestionForm();
    }

    getQuestionDetails(type) {
        const details = {};
        switch (type) {
            case 'radar':
                const distance = document.getElementById('radarDistance').value;
                const answer = document.getElementById('radarAnswer').value;
                if (!distance || !answer) return null;
                details.distance = distance;
                details.answer = answer;
                break;
            case 'matching':
                const attribute = document.getElementById('matchingAttribute').value;
                const mAnswer = document.getElementById('matchingAnswer').value;
                details.attribute = attribute;
                details.answer = mAnswer;
                break;
            case 'measuring':
                const metric = document.getElementById('measuringMetric').value;
                const meAnswer = document.getElementById('measuringAnswer').value;
                details.metric = metric;
                details.answer = meAnswer;
                break;
            case 'thermometer':
                const tDistance = document.getElementById('thermometerDistance').value;
                const tAnswer = document.getElementById('thermometerAnswer').value;
                details.distance = tDistance;
                details.answer = tAnswer;
                break;
            case 'tentacles':
                const place = document.getElementById('tentaclesPlace').value;
                const tentDistance = document.getElementById('tentaclesDistance').value;
                const tentAnswer = document.getElementById('tentaclesAnswer').value;
                if (!tentAnswer) return null;
                details.place = place;
                details.distance = tentDistance;
                details.answer = tentAnswer;
                break;
        }
        return details;
    }

    updateMap() {
        // Clear previous layers
        this.layers.excluded.forEach(layer => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        });
        this.layers.excluded = [];

        // Draw search zones based on questions
        this.questions.forEach((q, idx) => {
            if (q.type === 'radar') {
                this.drawRadarZone(q, idx);
            }
        });
    }

    drawRadarZone(question, index) {
        const radiusKm = parseFloat(question.details.distance) * 1.60934; // Convert miles to km
        const isWithin = question.details.answer === 'within';
        
        const circle = L.circle([this.myLocation.lat, this.myLocation.lng], {
            radius: radiusKm * 1000,
            color: isWithin ? '#48bb78' : '#667eea',
            weight: 2,
            opacity: isWithin ? 0.6 : 0.6,
            fillOpacity: isWithin ? 0.15 : 0.3,
            fillColor: isWithin ? '#48bb78' : '#667eea',
            dashArray: isWithin ? '5, 5' : ''
        }).bindPopup(`Q${index + 1}: ${isWithin ? 'Search area' : 'Excluded area'}`).addTo(this.map);
        
        this.layers.excluded.push(circle);
    }

    calculateSearchArea() {
        if (this.questions.length === 0) {
            return Infinity;
        }

        let minRadius = Infinity;

        this.questions.forEach(q => {
            if (q.type === 'radar' && q.details.answer === 'within') {
                const radius = parseFloat(q.details.distance);
                minRadius = Math.min(minRadius, radius);
            }
        });

        return minRadius === Infinity ? Infinity : minRadius;
    }

    renderQuestionsList() {
        const list = document.getElementById('questionsList');
        list.innerHTML = '';

        this.questions.forEach((q, idx) => {
            const item = document.createElement('div');
            item.className = 'question-item';
            
            let details = '';
            switch (q.type) {
                case 'radar':
                    details = `${q.details.distance}mi: ${q.details.answer}`;
                    break;
                case 'matching':
                    details = `${q.details.attribute}: ${q.details.answer}`;
                    break;
                case 'measuring':
                    details = `${q.details.metric}: ${q.details.answer}`;
                    break;
                case 'thermometer':
                    details = `${q.details.distance}mi: ${q.details.answer}`;
                    break;
                case 'tentacles':
                    details = `Closest ${q.details.place}: ${q.details.answer}`;
                    break;
            }

            item.innerHTML = `
                <strong>Q${idx + 1}: ${q.type.toUpperCase()}</strong>
                <div>${details}</div>
                <small>${q.timestamp}</small>
                <button class="remove-btn" onclick="app.removeQuestion(${idx})">×</button>
            `;
            list.appendChild(item);
        });
    }

    removeQuestion(index) {
        this.questions.splice(index, 1);
        this.updateMap();
        this.renderQuestionsList();
        this.updateStats();
    }

    clearQuestionForm() {
        const type = document.getElementById('questionType').value;
        if (type === 'tentacles') {
            document.getElementById('tentaclesAnswer').value = '';
        }
    }

    updateStats() {
        document.getElementById('questionCount').textContent = this.questions.length;
        
        const searchRadius = this.calculateSearchArea();
        if (searchRadius !== Infinity) {
            document.getElementById('searchRadius').textContent = `${searchRadius.toFixed(1)} miles`;
            const area = Math.PI * searchRadius * searchRadius;
            document.getElementById('searchArea').textContent = `${area.toFixed(0)} sq miles`;
        } else {
            document.getElementById('searchRadius').textContent = 'Unlimited';
            document.getElementById('searchArea').textContent = 'World';
        }
    }

    clearAll() {
        if (confirm('Clear all questions? This cannot be undone.')) {
            this.questions = [];
            this.updateMap();
            this.renderQuestionsList();
            this.updateStats();
        }
    }

    exportData() {
        const data = {
            myLocation: this.myLocation,
            questions: this.questions,
            exportTime: new Date().toISOString(),
            searchRadius: this.calculateSearchArea()
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
