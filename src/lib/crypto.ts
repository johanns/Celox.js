import { Cipher } from 'crypto';

type CipherObject = {
    data: string;
    iv: string;
    salt: string;
};

/**
 * Decrypts the given cipher object using the provided password.
 * @param data - The cipher object containing encrypted data, initialization vector, and salt
 * @param password - The password used for decryption
 * @returns A promise that resolves to the decrypted string
 */
export async function decrypt(data: CipherObject, password: string) {
    // Convert base64 strings to ArrayBuffers
    const iv = base64ToArrayBuffer(data.iv);
    const salt = base64ToArrayBuffer(data.salt);
    const encryptedData = base64ToArrayBuffer(data.data);

    // Derive the key from the password and salt
    const key = await deriveKey(password, salt);

    // Decrypt the data using AES-GCM
    const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        new Uint8Array(encryptedData),
    );

    // Convert the decrypted ArrayBuffer to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * @param password - The password to derive the key from
 * @param salt - The salt used in key derivation
 * @param iterations - The number of iterations for PBKDF2 (default: 10,000)
 * @returns A promise that resolves to the derived CryptoKey
 */
export async function deriveKey(
    password: string,
    salt: Uint8Array,
    iterations = 10_000,
) {
    const encoder = new TextEncoder();
    // Import the password as a raw key
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey'],
    );

    // Derive the actual encryption key using PBKDF2
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: iterations,
            hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt'],
    );
}

/**
 * Encrypts the given data using the provided password.
 * @param data - The string to encrypt
 * @param password - The password to use for encryption
 * @returns A promise that resolves to a CipherObject containing the encrypted data, IV, and salt
 */
export async function encrypt(data: string, password: string) {
    const encoder = new TextEncoder();
    // Generate a random salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    // Derive the key from the password and salt
    const key = await deriveKey(password, salt);
    // Generate a random initialization vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data using AES-GCM
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(data),
    );

    // Return the encrypted data, IV, and salt as base64 strings
    return {
        data: arrayBufferToBase64(encryptedContent),
        iv: arrayBufferToBase64(iv),
        salt: arrayBufferToBase64(salt),
    };
}

/**
 * Generates a random string of specified length.
 * @param length - The length of the random string to generate
 * @returns A random string of the specified length
 */
export function generateRandomString(length: number): string {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Generate cryptographically secure random values
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    // Use the random values to select characters from the character set
    for (let i = 0; i < length; i++) {
        const randomIndex = randomValues[i] % characters.length;
        result += characters[randomIndex];
    }

    return result;
}

// Internal helper functions

/**
 * Converts an ArrayBuffer to a base64 string.
 * @param buffer - The ArrayBuffer to convert
 * @returns A base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer) {
    const binary = String.fromCharCode.apply(
        null,
        Array.from(new Uint8Array(buffer)),
    );
    return btoa(binary);
}

/**
 * Converts a base64 string to an ArrayBuffer.
 * @param base64 - The base64 string to convert
 * @returns A Uint8Array containing the decoded data
 */
function base64ToArrayBuffer(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
