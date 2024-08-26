import { NextResponse } from 'next/server';
import { createMessage } from '@/models/message';
import ModelValidationError from '@/lib/modelValidationError';

/**
 * POST handler for creating a new message.
 * This function handles the HTTP POST request to create a new message.
 * It reads the request body, creates a message, and returns the message stub.
 *
 * @param request - The incoming HTTP request
 * @returns A promise that resolves to a NextResponse object
 */
export async function POST(request: NextResponse) {
    try {
        // Extract the message content from the request body
        const content = await request.text();

        // Attempt to create a new message
        const message = await createMessage(content);

        // If successful, return the message stub with a 200 OK status
        return NextResponse.json({ stub: message.stub });
    } catch (error) {
        console.error(error);

        // Handle different types of errors
        if (error instanceof ModelValidationError) {
            // If it's a validation error, return the error details with a 422 Unprocessable Entity status
            return NextResponse.json({ errors: error.errors }, { status: 422 });
        } else {
            // For any other error, return a generic error message with a 500 Internal Server Error status
            return NextResponse.json(
                { error: 'An unexpected error has occurred' },
                { status: 500 },
            );
        }
    }
}
