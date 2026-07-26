// Geographic and country data service

class GeoDataService {
    constructor() {
        this.countryCache = {};
        this.locationCache = {};
    }

    /**
     * Get country info from coordinates using Nominatim
     */
    async getCountryFromCoordinates(lat, lng) {
        const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (this.locationCache[cacheKey]) {
            return this.locationCache[cacheKey];
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept': 'application/json' } }
            );
            const data = await response.json();
            const address = data.address || {};
            const country = address.country || 'Unknown';
            const continent = this.getContinent(address.country_code);
            
            this.locationCache[cacheKey] = {
                country,
                continent,
                countryCode: address.country_code
            };
            return this.locationCache[cacheKey];
        } catch (error) {
            console.error('Error fetching country data:', error);
            return { country: 'Unknown', continent: 'Unknown', countryCode: null };
        }
    }

    /**
     * Get detailed country data from REST Countries API
     */
    async getCountryData(countryCode) {
        if (this.countryCache[countryCode]) {
            return this.countryCache[countryCode];
        }

        try {
            const response = await fetch(
                `https://restcountries.com/v3.1/alpha/${countryCode}`
            );
            const [data] = await response.json();
            
            const countryInfo = {
                name: data.name?.common || data.name?.official,
                population: data.population,
                area: data.area,
                gdp: data.gini ? Object.values(data.gini)[0] : null,
                languages: data.languages ? Object.values(data.languages) : [],
                currencies: data.currencies ? Object.keys(data.currencies) : [],
                region: data.region,
                subregion: data.subregion,
                timezone: data.timezones ? data.timezones[0] : null,
                script: this.getScript(data.languages),
                religion: this.guessReligion(countryCode),
                capital: data.capital ? data.capital[0] : null,
                coords: data.latlng ? { lat: data.latlng[0], lng: data.latlng[1] } : null
            };
            
            this.countryCache[countryCode] = countryInfo;
            return countryInfo;
        } catch (error) {
            console.error('Error fetching country data:', error);
            return null;
        }
    }

    /**
     * Get temperature data for a location
     */
    async getTemperature(lat, lng) {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,is_day&timezone=auto`
            );
            const data = await response.json();
            return data.current.temperature_2m;
        } catch (error) {
            console.error('Error fetching temperature:', error);
            return null;
        }
    }

    /**
     * Find nearby places using Overpass API
     */
    async getNearbyPlaces(lat, lng, placeType, radiusMiles) {
        const radiusMeters = radiusMiles * 1609.34;
        
        const placeTagMap = {
            'hotel': 'tourism=hotel',
            'library': 'amenity=library',
            'hospital': 'amenity=hospital',
            'museum': 'tourism=museum',
            'theater': 'amenity=cinema',
            'aquarium': 'tourism=aquarium',
            'park': 'tourism=theme_park',
            'zoo': 'tourism=zoo'
        };
        
        const tag = placeTagMap[placeType] || `amenity=${placeType}`;
        
        try {
            const query = `[bbox=${lng - radiusMeters/111000},${lat - radiusMeters/111000},${lng + radiusMeters/111000},${lat + radiusMeters/111000}];(node[${tag}];way[${tag}];);out center 20;`;
            const response = await fetch(
                `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            
            const places = [];
            data.elements?.forEach(element => {
                const elemLat = element.center?.lat || element.lat;
                const elemLng = element.center?.lon || element.lon;
                if (elemLat && elemLng) {
                    const distance = this.calculateDistance(
                        { lat, lng },
                        { lat: elemLat, lng: elemLng }
                    );
                    places.push({
                        name: element.tags?.name || `${placeType} ${places.length + 1}`,
                        lat: elemLat,
                        lng: elemLng,
                        distance: distance,
                        type: placeType
                    });
                }
            });
            
            // Sort by distance and return top 5
            return places.sort((a, b) => a.distance - b.distance).slice(0, 5);
        } catch (error) {
            console.error('Error fetching nearby places:', error);
            return [];
        }
    }

    /**
     * Calculate distance between two points
     */
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

    /**
     * Get continent from country code
     */
    getContinent(countryCode) {
        const continents = {
            'AF': 'Africa',
            'AG': 'North America',
            'AI': 'North America',
            'AQ': 'Antarctica',
            'AR': 'South America',
            'AT': 'Europe',
            'AU': 'Oceania',
            'AX': 'Europe',
            'AZ': 'Asia',
            'BA': 'Europe',
            'BB': 'North America',
            'BD': 'Asia',
            'BE': 'Europe',
            'BF': 'Africa',
            'BG': 'Europe',
            'BH': 'Asia',
            'BI': 'Africa',
            'BJ': 'Africa',
            'BL': 'North America',
            'BM': 'North America',
            'BN': 'Asia',
            'BO': 'South America',
            'BQ': 'North America',
            'BR': 'South America',
            'BS': 'North America',
            'BT': 'Asia',
            'BW': 'Africa',
            'BY': 'Europe',
            'BZ': 'North America',
            'CA': 'North America',
            'CC': 'Asia',
            'CD': 'Africa',
            'CF': 'Africa',
            'CG': 'Africa',
            'CH': 'Europe',
            'CI': 'Africa',
            'CK': 'Oceania',
            'CL': 'South America',
            'CM': 'Africa',
            'CN': 'Asia',
            'CO': 'South America',
            'CR': 'North America',
            'CU': 'North America',
            'CV': 'Africa',
            'CW': 'North America',
            'CX': 'Asia',
            'CY': 'Europe',
            'CZ': 'Europe',
            'DE': 'Europe',
            'DJ': 'Africa',
            'DK': 'Europe',
            'DM': 'North America',
            'DO': 'North America',
            'DZ': 'Africa',
            'EC': 'South America',
            'EE': 'Europe',
            'EG': 'Africa',
            'EH': 'Africa',
            'ER': 'Africa',
            'ES': 'Europe',
            'ET': 'Africa',
            'FI': 'Europe',
            'FJ': 'Oceania',
            'FK': 'South America',
            'FM': 'Oceania',
            'FO': 'Europe',
            'FR': 'Europe',
            'GA': 'Africa',
            'GB': 'Europe',
            'GD': 'North America',
            'GE': 'Asia',
            'GF': 'South America',
            'GG': 'Europe',
            'GH': 'Africa',
            'GI': 'Europe',
            'GL': 'North America',
            'GM': 'Africa',
            'GN': 'Africa',
            'GP': 'North America',
            'GQ': 'Africa',
            'GR': 'Europe',
            'GS': 'South America',
            'GT': 'North America',
            'GU': 'Oceania',
            'GW': 'Africa',
            'GY': 'South America',
            'HK': 'Asia',
            'HN': 'North America',
            'HR': 'Europe',
            'HT': 'North America',
            'HU': 'Europe',
            'ID': 'Asia',
            'IE': 'Europe',
            'IL': 'Asia',
            'IM': 'Europe',
            'IN': 'Asia',
            'IO': 'Asia',
            'IQ': 'Asia',
            'IR': 'Asia',
            'IS': 'Europe',
            'IT': 'Europe',
            'JE': 'Europe',
            'JM': 'North America',
            'JO': 'Asia',
            'JP': 'Asia',
            'KE': 'Africa',
            'KG': 'Asia',
            'KH': 'Asia',
            'KI': 'Oceania',
            'KM': 'Africa',
            'KN': 'North America',
            'KP': 'Asia',
            'KR': 'Asia',
            'KW': 'Asia',
            'KY': 'North America',
            'KZ': 'Asia',
            'LA': 'Asia',
            'LB': 'Asia',
            'LC': 'North America',
            'LI': 'Europe',
            'LK': 'Asia',
            'LR': 'Africa',
            'LS': 'Africa',
            'LT': 'Europe',
            'LU': 'Europe',
            'LV': 'Europe',
            'LY': 'Africa',
            'MA': 'Africa',
            'MC': 'Europe',
            'MD': 'Europe',
            'ME': 'Europe',
            'MF': 'North America',
            'MG': 'Africa',
            'MH': 'Oceania',
            'MK': 'Europe',
            'ML': 'Africa',
            'MM': 'Asia',
            'MN': 'Asia',
            'MO': 'Asia',
            'MP': 'Oceania',
            'MQ': 'North America',
            'MR': 'Africa',
            'MS': 'North America',
            'MT': 'Europe',
            'MU': 'Africa',
            'MV': 'Asia',
            'MW': 'Africa',
            'MX': 'North America',
            'MY': 'Asia',
            'MZ': 'Africa',
            'NA': 'Africa',
            'NC': 'Oceania',
            'NE': 'Africa',
            'NF': 'Oceania',
            'NG': 'Africa',
            'NI': 'North America',
            'NL': 'Europe',
            'NO': 'Europe',
            'NP': 'Asia',
            'NR': 'Oceania',
            'NU': 'Oceania',
            'NZ': 'Oceania',
            'OM': 'Asia',
            'PA': 'North America',
            'PE': 'South America',
            'PF': 'Oceania',
            'PG': 'Oceania',
            'PH': 'Asia',
            'PK': 'Asia',
            'PL': 'Europe',
            'PM': 'North America',
            'PN': 'Oceania',
            'PR': 'North America',
            'PS': 'Asia',
            'PT': 'Europe',
            'PW': 'Oceania',
            'PY': 'South America',
            'QA': 'Asia',
            'RE': 'Africa',
            'RO': 'Europe',
            'RS': 'Europe',
            'RU': 'Europe',
            'RW': 'Africa',
            'SA': 'Asia',
            'SB': 'Oceania',
            'SC': 'Africa',
            'SD': 'Africa',
            'SE': 'Europe',
            'SG': 'Asia',
            'SH': 'Africa',
            'SI': 'Europe',
            'SJ': 'Europe',
            'SK': 'Europe',
            'SL': 'Africa',
            'SM': 'Europe',
            'SN': 'Africa',
            'SO': 'Africa',
            'SR': 'South America',
            'SS': 'Africa',
            'ST': 'Africa',
            'SV': 'North America',
            'SX': 'North America',
            'SY': 'Asia',
            'SZ': 'Africa',
            'TC': 'North America',
            'TD': 'Africa',
            'TG': 'Africa',
            'TH': 'Asia',
            'TJ': 'Asia',
            'TK': 'Oceania',
            'TL': 'Asia',
            'TM': 'Asia',
            'TN': 'Africa',
            'TO': 'Oceania',
            'TR': 'Asia',
            'TT': 'North America',
            'TV': 'Oceania',
            'TW': 'Asia',
            'TZ': 'Africa',
            'UA': 'Europe',
            'UG': 'Africa',
            'UM': 'Oceania',
            'US': 'North America',
            'UY': 'South America',
            'UZ': 'Asia',
            'VA': 'Europe',
            'VC': 'North America',
            'VE': 'South America',
            'VG': 'North America',
            'VI': 'North America',
            'VN': 'Asia',
            'VU': 'Oceania',
            'WF': 'Oceania',
            'WS': 'Oceania',
            'YE': 'Asia',
            'YT': 'Africa',
            'ZA': 'Africa',
            'ZM': 'Africa',
            'ZW': 'Africa'
        };
        return continents[countryCode] || 'Unknown';
    }

    /**
     * Guess dominant religion by country code
     */
    guessReligion(countryCode) {
        const religions = {
            'SA': 'Islam',
            'IR': 'Islam',
            'AE': 'Islam',
            'EG': 'Islam',
            'PK': 'Islam',
            'ID': 'Islam',
            'IN': 'Hinduism',
            'CN': 'Buddhism',
            'TH': 'Buddhism',
            'VN': 'Buddhism',
            'JP': 'Shinto',
            'BR': 'Christianity',
            'MX': 'Christianity',
            'US': 'Christianity',
            'GB': 'Christianity',
            'DE': 'Christianity',
            'IT': 'Christianity',
            'FR': 'Christianity',
            'RU': 'Christianity',
            'IS': 'Christianity',
            'IL': 'Judaism'
        };
        return religions[countryCode] || 'Mixed';
    }

    /**
     * Get script type from languages
     */
    getScript(languages) {
        if (!languages) return 'Latin';
        const scriptMap = {
            'ar': 'Arabic',
            'zh': 'Hanzi',
            'ja': 'Japanese',
            'ko': 'Korean',
            'th': 'Thai',
            'he': 'Hebrew',
            'ru': 'Cyrillic',
            'el': 'Greek',
            'en': 'Latin'
        };
        const langCode = Object.keys(languages)[0];
        return scriptMap[langCode] || 'Latin';
    }
}

// Initialize global data service
const geoData = new GeoDataService();
