// Accent-insensitive lowercase, so "biceps" finds "B\u00edceps" and
// "sentadilla" finds "Sentadillas con Barra". Folding keeps the string
// length (a precomposed accented letter maps to one base letter), which the
// search highlight relies on.
export const fold = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Folded and reduced to word characters, for index keys and fuzzy matching:
// "Farmer's Walk (Heavy)" becomes "farmer s walk heavy".
export const foldKey = (s) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim();
