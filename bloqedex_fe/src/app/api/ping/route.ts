export async function GET() {
    return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function HEAD() {
    return new Response(null, {
        status: 200,
    });
}
