import crypto from 'crypto';
import prisma from '@/lib/prisma';
import ModelValidationError from '@/lib/modelValidationError';
import { cache } from 'react';

// Define the structure of a Message object
interface Message {
    content: string;
    readAt?: Date;
    stub: string;
}

/**
 * Generates a unique stub (short identifier) for messages.
 * This function attempts to create a random, unique alphanumeric string
 * that doesn't already exist in the database.
 *
 * @param batchSize - Number of stub candidates to generate in each attempt (default: 5)
 * @param retries - Number of times to retry generating if all candidates are taken (default: 3)
 * @param stubLength - Length of each generated stub (default: 8)
 * @returns A promise that resolves to a unique stub string, or null if generation fails
 */
async function generateUniqueStub(
    batchSize = 5,
    retries = 3,
    stubLength = 8,
): Promise<string | null> {
    // Define the character set for generating stubs
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Try to generate a unique stub for a set number of retries
    for (let retry = 0; retry < retries; retry++) {
        const candidates = [];

        // Generate a batch of random stub candidates
        for (let i = 0; i < batchSize; i++) {
            // Create a stub by randomly selecting characters from the set
            const candidate = Array.from(
                { length: stubLength },
                // Use crypto.randomInt for secure random number generation
                () => characters[crypto.randomInt(characters.length)],
            ).join('');

            candidates.push(candidate);
        }

        // Check if any of the candidates already exist in the database
        const stubs = await prisma.message.findMany({
            select: { stub: true },
            where: { stub: { in: candidates } },
        });

        // Create a Set of existing stubs for efficient lookup
        const stubSet = new Set(
            stubs.map(({ stub }: { stub: string }) => stub),
        );

        // Return the first candidate that doesn't exist in the database
        for (const candidate of candidates) {
            if (!stubSet.has(candidate)) {
                return candidate;
            }
        }

        // If all candidates are taken, log a warning and continue to the next retry
        console.warn(
            `Attempt ${retry + 1} failed to find a unique stub. Retrying...`,
        );
    }

    // If all retries fail, log an error and return null
    console.error(`Failed to generate a unique stub after ${retries} attempts`);

    return null;
}

/**
 * Validates a Message object to ensure it meets the required criteria.
 * This function checks the content and stub fields for various conditions,
 * such as required values, length limits, uniqueness, and alphanumeric characters.
 *
 * @param data - The Message object to validate
 * @throws {ModelValidationError} If the Message object is invalid
 */
async function validateMessage(data: Message) {
    // Define an object to store validation errors
    const errors: Record<string, string[]> = { content: [], stub: [] };

    // Validate content
    if (data.content === '') {
        errors.content.push('Content is required');
    }
    if (data.content.length > 10_000) {
        errors.content.push('Content is too long');
    }

    // Validate stub
    if (data.stub === '') {
        errors.stub.push('Stub is required');
    }
    if (data.stub.length < 8 || data.stub.length > 32) {
        errors.stub.push('Stub must be between 8 and 32 characters');
    }
    if (await prisma.message.findUnique({ where: { stub: data.stub } })) {
        errors.stub.push('Stub must be unique');
    }
    if (data.stub.match(/[^a-zA-Z0-9]/)) {
        errors.stub.push('Stub must be alphanumeric');
    }

    // If there are any errors, throw a ModelValidationError
    if (Object.values(errors).some((error) => error.length > 0)) {
        throw new ModelValidationError(errors, 'Message');
    }
}

/**
 * Creates a new message with the specified content.
 * This function generates a unique stub for the message and validates the content.
 *
 * @param content - The content of the message to create
 * @returns A promise that resolves to the created message object
 * @throws {ModelValidationError} If the message content or generated stub is invalid
 */
export async function createMessage(content: string) {
    // Generate a unique stub for the new message
    const stub = (await generateUniqueStub()) || '';

    // Validate the message (will throw an error if invalid)
    await validateMessage({ content, stub });

    // Create and return the new message in the database
    return prisma.message.create({
        data: {
            content,
            stub,
        },
    });
}

/**
 * Deletes a message with the specified stub.
 *
 * @param stub - The stub of the message to delete
 * @returns A promise that resolves to the deleted message object
 * @throws {Error} If the message with the given stub doesn't exist
 */
export async function deleteMessage(stub: string) {
    return prisma.message.delete({ where: { stub } });
}

/**
 * Retrieves a message with the specified stub.
 *
 * @param stub - The stub of the message to retrieve
 * @returns A promise that resolves to the message object, or null if not found
 */
export async function getMessage(stub: string) {
    return prisma.message.findUnique({ where: { stub } });
}

/**
 * Marks a message with the specified stub as read.
 * This function updates the message in the database to mark it as read.
 * The content of the message is changed to 'DEADBEEF' when marked as read.
 *
 * @param stub - The stub of the message to mark as read
 * @returns A promise that resolves to the updated message object if successful,
 *          or null if the message doesn't exist or is already read
 */
export async function markMessageAsRead(stub: string) {
    // Find the message in the database
    const message = await prisma.message.findUnique({ where: { stub } });

    // If message doesn't exist or is already read, return null
    if (!message || message.readAt) {
        return null;
    }

    // Update the message as read and change its content
    return prisma.message.update({
        where: { stub },
        data: { content: 'DEADBEEF', readAt: new Date() },
    });
}
