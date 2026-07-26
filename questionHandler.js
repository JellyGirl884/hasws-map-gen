// Question type handling and processing

const QuestionHandler = {
    QUESTION_TYPES: {
        matching: {
            name: 'Matching',
            description: 'Is your location\'s [attribute] the same as mine?'
        },
        measuring: {
            name: 'Measuring',
            description: 'Does your location have greater/lesser [metric]?'
        },
        thermometer: {
            name: 'Thermometer',
            description: 'Am I hotter or colder after traveling [distance]?'
        },
        radar: {
            name: 'Radar',
            description: 'Are you within [distance] of me?'
        },
        tentacles: {
            name: 'Tentacles',
            description: 'Which [place] within [distance] are you closest to?'
        }
    },

    processAnswer(question) {
        const { type, hiderLocation, details } = question;

        switch (type) {
            case 'matching':
                return this.processMatching(question);
            case 'measuring':
                return this.processMeasuring(question);
            case 'thermometer':
                return this.processThermometer(question);
            case 'radar':
                return this.processRadar(question);
            case 'tentacles':
                return this.processTentacles(question);
            default:
                return null;
        }
    },

    processMatching(question) {
        const { hiderLocation, details } = question;
        return {
            type: 'matching',
            attribute: details.attribute,
            answer: details.answer,
            hiderLocation,
            description: `Hider's location is ${details.answer} ${details.attribute} as yours`
        };
    },

    processMeasuring(question) {
        const { hiderLocation, details } = question;
        return {
            type: 'measuring',
            metric: details.metric,
            comparison: details.answer,
            hiderLocation,
            description: `Hider's ${details.metric} is ${details.answer} than yours`
        };
    },

    processThermometer(question) {
        const { hiderLocation, details } = question;
        const distanceMiles = parseFloat(details.distance);
        const distanceKm = distanceMiles * 1.60934;

        return {
            type: 'thermometer',
            distance: distanceMiles,
            direction: details.answer,
            hiderLocation,
            description: `After traveling ${distanceMiles} miles, you are ${details.answer}`
        };
    },

    processRadar(question) {
        const { hiderLocation, details } = question;
        const radiusMiles = parseFloat(details.distance);
        const radiusKm = radiusMiles * 1.60934;

        return {
            type: 'radar',
            radius: radiusMiles,
            isWithin: details.answer === 'within',
            hiderLocation,
            description: `Hider is ${details.answer} ${radiusMiles} miles`,
            exclusionZone: {
                center: question.hiderLocation,
                radius: radiusKm * 1000
            }
        };
    },

    processTentacles(question) {
        const { hiderLocation, details } = question;
        const radiusMiles = parseFloat(details.distance);

        return {
            type: 'tentacles',
            place: details.place,
            distance: radiusMiles,
            closest: details.answer,
            hiderLocation,
            description: `Closest ${details.place} within ${radiusMiles} miles is ${details.answer}`
        };
    },

    getExcludedRegion(processedQuestion) {
        // Return the geographic region that should be excluded based on the answer
        switch (processedQuestion.type) {
            case 'radar':
                if (!processedQuestion.isWithin) {
                    // Exclude the area inside the circle
                    return processedQuestion.exclusionZone;
                }
                break;
            case 'thermometer':
                // This would require climate data to properly exclude regions
                // For now, return null
                return null;
            default:
                return null;
        }
        return null;
    }
};
