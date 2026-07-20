/**
 * Exercise term translations (equipment + target muscle) from English to Spanish.
 *
 * The enrichment data (src/data/exerciseEnrichment.js) tags equipment and target
 * in English only; these maps localize the chips shown in the exercise demo modal.
 * Values are kept lowercase — the UI applies text-transform: capitalize.
 */

export const equipmentTranslations = {
    "band": "banda",
    "barbell": "barra",
    "body weight": "peso corporal",
    "cable": "cable",
    "dumbbell": "mancuerna",
    "elliptical machine": "máquina elíptica",
    "ez barbell": "barra ez",
    "kettlebell": "pesa rusa",
    "leverage machine": "máquina de palanca",
    "rope": "cuerda",
    "smith machine": "máquina smith",
    "weighted": "con peso",
};

export const targetTranslations = {
    "abs": "abdominales",
    "biceps": "bíceps",
    "calves": "pantorrillas",
    "cardiovascular system": "sistema cardiovascular",
    "delts": "deltoides",
    "forearms": "antebrazos",
    "glutes": "glúteos",
    "hamstrings": "isquiotibiales",
    "lats": "dorsales",
    "pectorals": "pectorales",
    "quads": "cuádriceps",
    "traps": "trapecios",
    "triceps": "tríceps",
    "upper back": "espalda alta",
};

const translate = (map, value, language) => {
    if (!value) return value;
    if (language === 'es') {
        return map[value.toLowerCase()] || value;
    }
    return value;
};

/**
 * @param {string} value - equipment name from the enrichment data
 * @param {'en'|'es'} [language]
 * @returns {string}
 */
export const translateEquipment = (value, language = 'en') =>
    translate(equipmentTranslations, value, language);

/**
 * @param {string} value - target muscle from the enrichment data
 * @param {'en'|'es'} [language]
 * @returns {string}
 */
export const translateTarget = (value, language = 'en') =>
    translate(targetTranslations, value, language);
