import { Request } from 'express';

/**
 * Supported languages
 */
export type SupportedLanguage = 'en' | 'ar';

/**
 * Default language fallback
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Get the preferred language from the request
 * Priority: 1. lang header, 2. user.selectedLanguage, 3. default (en)
 * 
 * @param req Express request object
 * @returns Selected language code
 */
export function getPreferredLanguage(req: Request): SupportedLanguage {
    // 1. Check lang header
    const langHeader = req.headers['lang'] as string | undefined;
    if (langHeader && isValidLanguage(langHeader)) {
        return langHeader as SupportedLanguage;
    }

    // 2. Check authenticated user's selected language (if available)
    if (req.user?.selectedLanguage && isValidLanguage(req.user.selectedLanguage)) {
        return req.user.selectedLanguage as SupportedLanguage;
    }

    // 3. Default to English
    return DEFAULT_LANGUAGE;
}

/**
 * Check if a language code is valid
 * 
 * @param lang Language code to validate
 * @returns True if valid, false otherwise
 */
function isValidLanguage(lang: string): boolean {
    return lang === 'en' || lang === 'ar';
}

/**
 * Extract localized value from a JSON i18n field
 * Falls back to English if requested language not available
 * 
 * @param i18nObject JSON object with language keys (e.g., { en: "Title", ar: "عنوان" })
 * @param language Preferred language
 * @returns Localized string value
 */
export function localizeField(
    i18nObject: any,
    language: SupportedLanguage = DEFAULT_LANGUAGE
): string {
    if (!i18nObject || typeof i18nObject !== 'object') {
        return '';
    }

    // Try requested language first
    if (i18nObject[language]) {
        return i18nObject[language];
    }

    // Fallback to English
    if (i18nObject[DEFAULT_LANGUAGE]) {
        return i18nObject[DEFAULT_LANGUAGE];
    }

    // Return first available value if neither en nor requested language exists
    const firstValue = Object.values(i18nObject)[0];
    return typeof firstValue === 'string' ? firstValue : '';
}

/**
 * Transform an object with i18n JSON fields to localized strings
 * 
 * @param data Object containing i18n fields
 * @param i18nFields Array of field names that should be localized
 * @param language Preferred language
 * @returns Transformed object with localized fields
 */
export function localizeObject<T extends Record<string, any>>(
    data: T,
    i18nFields: string[],
    language: SupportedLanguage = DEFAULT_LANGUAGE
): T {
    const localized = { ...data } as any;

    for (const field of i18nFields) {
        if (localized[field]) {
            localized[field] = localizeField(localized[field], language);
        }
    }

    return localized as T;
}

/**
 * Transform an array of objects with i18n JSON fields to localized strings
 * 
 * @param dataArray Array of objects containing i18n fields
 * @param i18nFields Array of field names that should be localized
 * @param language Preferred language
 * @returns Transformed array with localized fields
 */
export function localizeArray<T extends Record<string, any>>(
    dataArray: T[],
    i18nFields: string[],
    language: SupportedLanguage = DEFAULT_LANGUAGE
): T[] {
    return dataArray.map(item => localizeObject(item, i18nFields, language));
}

/**
 * Validate i18n input object has required languages
 * 
 * @param i18nObject Object to validate
 * @param requiredLanguages Languages that must be present (default: ['en'])
 * @returns True if valid, false otherwise
 */
export function validateI18nObject(
    i18nObject: any,
    requiredLanguages: SupportedLanguage[] = ['en']
): boolean {
    if (!i18nObject || typeof i18nObject !== 'object') {
        return false;
    }

    // Check all required languages are present and have non-empty strings
    return requiredLanguages.every(
        lang => i18nObject[lang] && typeof i18nObject[lang] === 'string' && i18nObject[lang].trim().length > 0
    );
}
