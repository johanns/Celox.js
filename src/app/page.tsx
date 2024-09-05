'use client';

import { encrypt, generateRandomString } from '@/lib/crypto';
import React, { FormEvent, useRef, useState } from 'react';

/**
 * Page component for creating encrypted messages.
 * This component provides a form for users to enter a message,
 * encrypts the message, sends it to the server, and displays the resulting URL.
 */
export default function Page() {
    // Refs and states for form elements and submission status
    const contentRef = useRef<HTMLTextAreaElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [encryptedContent, setEncryptedContent] = useState<string | null>(
        null,
    );
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [stub, setStub] = useState<string | null>(null);

    /**
     * Validates the content of the message.
     * @param content - The message content to validate
     * @returns An error message if validation fails, null otherwise
     */
    const validateContent = (content: string): string | null => {
        if (content.trim() === '') {
            return 'Content is required';
        }
        return null;
    };

    /**
     * Handles the form submission.
     * Validates the content, encrypts the message, sends it to the server,
     * and updates the component state based on the result.
     * @param event - The form submission event
     */
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!contentRef.current) {
            return;
        }

        const contentValue = contentRef.current.value;
        const validateError = validateContent(contentValue);

        if (validateError) {
            setError(validateError);
            return;
        }

        // Generate a random key for encryption
        const key = generateRandomString(12);

        // Encrypt the message content
        const encryptedContent = await encrypt(contentValue, key);

        // Reset state before submission
        setError(null);
        setIsSubmitting(true);
        setStub(null);
        setEncryptedContent(null);

        try {
            // Send the encrypted message to the server
            const response = await fetch('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: encryptedContent }),
            });

            if (response.ok) {
                // If successful, set the stub (URL) for the created message
                const { stub } = await response.json();
                setStub(`${stub}/#${key}`);
                setEncryptedContent(JSON.stringify(encryptedContent, null, 2));
                contentRef.current.value = '';
            } else if (response.status >= 400 && response.status < 500) {
                // Handle client-side errors
                const { errors } = await response.json();
                setError(errors.content.join(', '));
            } else {
                // Handle server-side errors
                setError('Unexpected server error');
            }
        } catch (error) {
            // Handle network or other errors
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to create message');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render the success view if a stub (URL) is available
    if (stub) {
        return (
            <>
                <div className="mb-4 p-4 bg-green-100 text-green-700 border border-green-400 rounded">
                    <a href={`${window.location.origin}/${stub}`}>
                        {window.location.origin}/{stub}
                    </a>
                </div>
                <button
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring"
                    onClick={() => {
                        setEncryptedContent(null);
                        setStub(null);
                    }}
                >
                    New Message
                </button>
                {encryptedContent && (
                    <div className="mt-4 p-4 bg-gray-100 text-gray-700 border border-gray-400 rounded">
                        <h3 className="font-bold mb-2">Encrypted Content:</h3>
                        <pre>
                            <code className="break-all">
                                {encryptedContent}
                            </code>
                        </pre>
                    </div>
                )}
            </>
        );
    }

    // Render the form view
    return (
        <form method="POST" onSubmit={handleSubmit}>
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <textarea
                    name="content"
                    className={`w-full p-2 border rounded focus:outline-none focus:ring ${
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter your message here"
                    ref={contentRef}
                />
            </div>

            <div className="mb-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`
                                w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring
                                ${isSubmitting ? 'bg-blue-300' : 'bg-blue-300'}
                            `}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </form>
    );
}
