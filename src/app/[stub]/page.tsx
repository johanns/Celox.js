'use client';

import { useEffect, useState } from 'react';
import { decrypt } from '@/lib/crypto';

type Message = {
    content: string;
    readAt?: string;
};

type ContentProps = {
    children: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
};

const ContentWrapper: React.FC<ContentProps> = ({
    children,
    bgColor,
    borderColor,
    textColor,
}) => (
    <>
        <div
            className={`mb-4 p-4 ${bgColor} ${textColor} border ${borderColor} rounded`}
        >
            {children}
        </div>
        <button
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring"
            onClick={() => (window.location.href = '/')}
        >
            New Message
        </button>
    </>
);

/**
 * Page component for viewing encrypted messages.
 * This component fetches an encrypted message, decrypts it using a key from the URL hash,
 * and displays the decrypted content or relevant error messages.
 */
export default function Page({
    params,
}: {
    params: { stub: string };
}): React.ReactNode {
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
            <ContentWrapper
                bgColor="bg-red-100"
                textColor="text-red-700"
                borderColor="border-red-400"
            >
                {error}
            </ContentWrapper>
        );
    }

    // Display a warning if the message has already been read
    if (message && message.readAt) {
        return (
            <ContentWrapper
                bgColor="bg-yellow-100"
                textColor="text-yellow-700"
                borderColor="border-yellow-400"
            >
                Message already read: {message.readAt}
            </ContentWrapper>
        );
    }

    // Display the decrypted message content
    return (
        <ContentWrapper
            bgColor="bg-blue-100"
            textColor="text-blue-700"
            borderColor="border-blue-400"
        >
            {message?.content}
        </ContentWrapper>
    );
}
