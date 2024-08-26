'use client';

import { useEffect, useState } from 'react';
import { decrypt } from '@/lib/crypto';

type Message = {
    content: string;
    readAt?: string;
};

/**
 * Page component for viewing encrypted messages.
 * This component fetches an encrypted message, decrypts it using a key from the URL hash,
 * and displays the decrypted content or relevant error messages.
 */
export default function Page({ params }: { params: { stub: string } }) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<Message | null>(null);

    useEffect(() => {
        async function fetchData() {
            // Extract the decryption key from the URL hash
            const key = window.location.hash.substring(1);

            try {
                if (!key) {
                    return setError('No key provided');
                }

                // Fetch the encrypted message from the API
                const response = await fetch(`/api/message/${params.stub}`);
                const rawData = await response.json();

                if (response.status === 404) {
                    return setError(rawData.error);
                }

                if (!response.ok) {
                    throw new Error(rawData.error);
                }

                // Check if the message has already been read
                if (rawData.readAt !== null) {
                    return setMessage(rawData);
                }

                // Decrypt the message content
                const data = JSON.parse(rawData.message);
                const decryptedData = await decrypt(data.content, key);
                setMessage({ ...data, content: decryptedData });
            } catch (error) {
                if (error instanceof Error && error?.message !== '') {
                    setError(error.message);
                } else {
                    setError('An unexpected error has occurred');
                }
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.stub]);

    // Display loading state
    if (loading) {
        return <div>Loading...</div>;
    }

    // Display error message if any
    if (error) {
        return (
            <div className="w-full max-w-lg p-10 bg-white shadow-sm rounded">
                <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">
                    {error}
                </div>
            </div>
        );
    }

    // Display a warning if the message has already been read
    if (message && message.readAt) {
        return (
            <div className="w-full max-w-lg p-10 bg-white shadow-sm rounded">
                <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded">
                    Message already read: {message.readAt}
                </div>
            </div>
        );
    }

    // Display the decrypted message content
    return (
        <div className="w-full max-w-lg p-10 bg-white shadow-sm rounded">
            <div className="mb-4 p-4 bg-blue-100 text-blue-700 border border-blue-400 rounded">
                {message?.content}
            </div>
        </div>
    );
}
