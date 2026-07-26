// Map visualization and handling

const MapHandler = {
    layers: {
        excluded: [],
        searchArea: null,
        hiderMarkers: []
    },

    clearLayers() {
        this.layers.excluded.forEach(layer => {
            if (app.map.hasLayer(layer)) {
                app.map.removeLayer(layer);
            }
        });
        this.layers.excluded = [];
        this.layers.hiderMarkers.forEach(marker => {
            if (app.map.hasLayer(marker)) {
                app.map.removeLayer(marker);
            }
        });
        this.layers.hiderMarkers = [];
    },

    drawRadarZone(center, radiusMiles, isExcluded) {
        const radiusKm = radiusMiles * 1.60934;
        const color = isExcluded ? '#667eea' : '#48bb78';
        const fillColor = isExcluded ? '#667eea' : '#48bb78';
        const fillOpacity = isExcluded ? 0.2 : 0.1;

        const circle = L.circle(center, {
            radius: radiusKm * 1000,
            color: color,
            weight: 2,
            opacity: 0.6,
            fillOpacity: fillOpacity,
            fillColor: fillColor,
            dashArray: isExcluded ? '' : '5, 5'
        }).addTo(app.map);

        this.layers.excluded.push(circle);
        return circle;
    },

    drawSearchArea(center, radiusMiles) {
        if (this.layers.searchArea) {
            app.map.removeLayer(this.layers.searchArea);
        }

        const radiusKm = radiusMiles * 1.60934;
        this.layers.searchArea = L.circle(center, {
            radius: radiusKm * 1000,
            color: '#48bb78',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.15,
            fillColor: '#48bb78',
            dashArray: '10, 5'
        }).addTo(app.map);

        return this.layers.searchArea;
    },

    addHiderMarker(lat, lng, questionIndex) {
        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: '#f56565',
            color: '#c53030',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        }).bindPopup(`Hider Location Q${questionIndex + 1}`).addTo(app.map);

        this.layers.hiderMarkers.push(marker);
        return marker;
    },

    calculateSearchArea() {
        if (app.questions.length === 0) {
            return Infinity;
        }

        let minRadius = Infinity;

        app.questions.forEach(q => {
            if (q.type === 'radar' && q.details.answer === 'within') {
                const radius = parseFloat(q.details.distance);
                minRadius = Math.min(minRadius, radius);
            }
        });

        return minRadius === Infinity ? Infinity : minRadius;
    },

    updateDisplay() {
        this.clearLayers();

        app.questions.forEach((q, idx) => {
            const hiderLoc = q.hiderLocation;
            this.addHiderMarker(hiderLoc.lat, hiderLoc.lng, idx);

            if (q.type === 'radar') {
                const isExcluded = q.details.answer === 'outside';
                this.drawRadarZone(app.myLocation, parseFloat(q.details.distance), isExcluded);
            }
        });

        const searchRadius = this.calculateSearchArea();
        if (searchRadius !== Infinity) {
            this.drawSearchArea(app.myLocation, searchRadius);
            document.getElementById('searchRadius').textContent = `${searchRadius.toFixed(1)} miles`;
        } else {
            document.getElementById('searchRadius').textContent = 'Unlimited';
        }
    }
};
