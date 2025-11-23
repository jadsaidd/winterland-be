/**
 * Format country code response to include flagUrl from media
 * @param countryCode Country code with optional flagMedia relation
 * @returns Formatted country code
 */
export const formatCountryCodeResponse = (countryCode: any) => {
    if (!countryCode) return null;

    const formatted = { ...countryCode };

    // If flagMedia exists, set flagUrl from media.url
    if (countryCode.flagMedia?.url) {
        formatted.flagUrl = countryCode.flagMedia.url;
    }

    return formatted;
};

/**
 * Format multiple country codes
 * @param countryCodes Array of country codes
 * @returns Formatted country codes
 */
export const formatCountryCodesResponse = (countryCodes: any[]) => {
    return countryCodes.map(formatCountryCodeResponse);
};
