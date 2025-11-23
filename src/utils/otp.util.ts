import crypto from 'crypto';

/**
 * Generates a secure random integer OTP (One-Time Password) using cryptographically secure random bytes.
 * @param digits - Number of digits for the OTP (default: 4)
 * @returns A string containing the OTP
 * @throws Error if digits parameter is invalid
 */
export function generateOTP(digits: number = 4): string {
    // Validate input
    if (!Number.isInteger(digits) || digits <= 0 || digits > 10) {
        throw new Error('Digits must be a positive integer between 1 and 10');
    }

    const max = Math.pow(10, digits);
    const byteLength = Math.ceil(Math.log2(max) / 8);

    let otp: number;
    do {
        // Generate enough random bytes for the required digit count
        const randomBytes = crypto.randomBytes(byteLength);
        otp = Number.parseInt(randomBytes.toString('hex'), 16);
    } while (otp >= max);

    // Ensure the OTP has the correct number of digits (pad with leading zeros)
    return otp.toString().padStart(digits, '0');
}