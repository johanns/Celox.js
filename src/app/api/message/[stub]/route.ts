import { NextResponse } from 'next/server';
import { deleteMessage, getMessage, markMessageAsRead } from '@/models/message';

/**
 * GET handler for retrieving a message.
 * This function handles the HTTP GET request to retrieve a message by its stub.
 * It also marks the message as read upon successful retrieval.
 *
 * @param _ - Unused request parameter
 * @param params - Object containing the route parameters, including the message stub
 * @returns A promise that resolves to a NextResponse object
 */
export async function GET(
    _: NextResponse,
    { params }: { params: { stub: string } },
) {
    try {
        // Attempt to retrieve the message using the provided stub
        const message = await getMessage(params.stub);

        // If the message doesn't exist, return a 404 Not Found response
        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 },
            );
        }

        // Mark the message as read
        await markMessageAsRead(params.stub);

        // Return the message content and read timestamp
        return NextResponse.json({
            message: message.content,
            readAt: message.readAt,
        });
    } catch (error) {
        console.error(error);

        // Handle any unexpected errors
        return NextResponse.json(
            { error: 'An unexpected error has occurred' },
            { status: 500 },
        );
    }
}

/**
 * DELETE handler for removing a message.
 * This function handles the HTTP DELETE request to remove a message by its stub.
 *
 * @param params - Object containing the route parameters, including the message stub
 * @returns A promise that resolves to a NextResponse object
 */
export async function DELETE({ params }: { params: { stub: string } }) {
    try {
        // Attempt to delete the message using the provided stub
        await deleteMessage(params.stub);

        // If successful, return a success response
        return NextResponse.json({ success: true });
    } catch (error) {
        // Log the error for debugging purposes
        console.error(error);

        // Return a generic error response
        return NextResponse.json(
            { error: 'An unexpected error has occurred' },
            { status: 500 },
        );
    }
}
