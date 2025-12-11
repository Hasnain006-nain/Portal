const crypto = require('crypto');

/**
 * Password Security Utilities
 * Provides password history checking, breach detection, and strong password generation
 */

/**
 * Hash a password using SHA-1 for HIBP API
 * @param {string} password - The password to hash
 * @returns {string} - The SHA-1 hash in uppercase
 */
function hashPasswordForHIBP(password) {
    return crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
}

/**
 * Check if password has been leaked using Have I Been Pwned API
 * @param {string} password - The password to check
 * @returns {Promise<{isLeaked: boolean, count: number}>}
 */
async function checkPasswordBreach(password) {
    try {
        const hash = hashPasswordForHIBP(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5);

        // Query HIBP API with k-anonymity (only send first 5 chars)
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: {
                'User-Agent': 'StudentHub-Password-Checker'
            }
        });

        if (!response.ok) {
            console.error('HIBP API error:', response.status);
            return { isLeaked: false, count: 0, error: 'API unavailable' };
        }

        const data = await response.text();
        const hashes = data.split('\n');

        // Check if our hash suffix appears in the results
        for (const line of hashes) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix === suffix) {
                return { isLeaked: true, count: parseInt(count, 10) };
            }
        }

        return { isLeaked: false, count: 0 };
    } catch (error) {
        console.error('Error checking password breach:', error);
        return { isLeaked: false, count: 0, error: error.message };
    }
}

/**
 * Check if password was used before by comparing with password history
 * @param {Array<string>} passwordHistory - Array of hashed previous passwords
 * @param {string} newPassword - The new password to check
 * @param {Function} compareFunction - bcrypt compare function
 * @returns {Promise<boolean>}
 */
async function checkPasswordHistory(passwordHistory, newPassword, compareFunction) {
    if (!passwordHistory || passwordHistory.length === 0) {
        return false;
    }

    for (const oldHash of passwordHistory) {
        const isMatch = await compareFunction(newPassword, oldHash);
        if (isMatch) {
            return true;
        }
    }

    return false;
}

/**
 * Generate a strong random password
 * @param {number} length - Password length (default: 16)
 * @returns {string}
 */
function generateStrongPassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';

    // Ensure at least one character from each category
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += special[crypto.randomInt(0, special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
}

/**
 * Generate multiple strong password suggestions
 * @param {number} count - Number of passwords to generate (default: 3)
 * @param {number} length - Password length (default: 16)
 * @returns {Array<string>}
 */
function generatePasswordSuggestions(count = 3, length = 16) {
    const suggestions = [];
    for (let i = 0; i < count; i++) {
        suggestions.push(generateStrongPassword(length));
    }
    return suggestions;
}

module.exports = {
    checkPasswordBreach,
    checkPasswordHistory,
    generateStrongPassword,
    generatePasswordSuggestions
};
