import { describe, it, expect } from 'vitest';
import { LEGAL_VERSION } from './version.js';
import { legalDocuments, consentSummary, LEGAL_DOCS, OPERATOR, getLegalDocument, getConsentSummary } from './legalText.js';

describe('legal texts', () => {
    it('uses a version the acceptance table accepts', () => {
        expect(LEGAL_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it.each(LEGAL_DOCS)('%s has the same sections in English and Spanish', (doc) => {
        const { en, es } = legalDocuments[doc];
        expect(es.sections).toHaveLength(en.sections.length);
        en.sections.forEach((section, index) => {
            const other = es.sections[index];
            expect(other.paragraphs).toHaveLength(section.paragraphs.length);
            // Section numbers line up, so "section 5" means the same in both.
            expect(other.heading.split('.')[0]).toBe(section.heading.split('.')[0]);
        });
    });

    it.each(LEGAL_DOCS)('%s has no empty or repeated text', (doc) => {
        ['en', 'es'].forEach((language) => {
            const content = legalDocuments[doc][language];
            const paragraphs = content.sections.flatMap((section) => section.paragraphs);
            paragraphs.forEach((paragraph) => expect(paragraph.trim().length).toBeGreaterThan(20));
            expect(new Set(paragraphs).size).toBe(paragraphs.length);
            expect(content.updated).toContain(LEGAL_VERSION);
        });
    });

    it('names the operator and a contact address in both documents and languages', () => {
        LEGAL_DOCS.forEach((doc) => ['en', 'es'].forEach((language) => {
            const text = JSON.stringify(legalDocuments[doc][language]);
            expect(text).toContain(OPERATOR.name);
            expect(text).toContain(OPERATOR.email);
        }));
    });

    it('keeps the consent summary in step across languages', () => {
        expect(consentSummary.es.points).toHaveLength(consentSummary.en.points.length);
        expect(Object.keys(consentSummary.es)).toEqual(Object.keys(consentSummary.en));
    });

    it('falls back to English for an unknown language', () => {
        expect(getLegalDocument('terms', 'fr')).toBe(legalDocuments.terms.en);
        expect(getConsentSummary('fr')).toBe(consentSummary.en);
        expect(getLegalDocument('nope', 'en')).toBeNull();
    });
});
