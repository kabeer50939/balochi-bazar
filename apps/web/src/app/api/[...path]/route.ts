/**
 * Universal API Proxy Route
 * 
 * Forwards every /api/* request from the browser to the backend server.
 * Since this runs server-side on Vercel Node.js, there is NO CORS — 
 * the browser only talks to the same origin (Next.js), which then
 * relays the request to the backend server-to-server.
 * 
 * e.g. GET /api/products  →  https://balochi-bazar-backend.vercel.app/api/products
 *      POST /api/auth/login  →  https://balochi-bazar-backend.vercel.app/api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';

const isLocal = process.env.NODE_ENV === 'development';
const BACKEND_BASE = isLocal
  ? 'http://localhost:5000'
  : 'https://balochi-bazar-backend.vercel.app';

async function proxyRequest(
  req: NextRequest,
  context: { params: { path: string[] } }
) {
  const pathSegments = context.params.path ?? [];
  const apiPath = '/api/' + pathSegments.join('/');

  // Preserve any query string from the original request
  const { search } = new URL(req.url);
  const targetUrl = `${BACKEND_BASE}${apiPath}${search}`;

  // Forward headers (except 'host' which must match the target)
  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      forwardHeaders[key] = value;
    }
  });

  // Read body for non-GET/HEAD methods
  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const responseText = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') ?? 'application/json';

    return new NextResponse(responseText, {
      status: backendRes.status,
      headers: { 'content-type': contentType },
    });
  } catch (err: any) {
    console.error('[API Proxy Error]', targetUrl, err.message);
    return NextResponse.json(
      { error: 'Backend unreachable', details: err.message },
      { status: 502 }
    );
  }
}

export const GET     = proxyRequest;
export const POST    = proxyRequest;
export const PUT     = proxyRequest;
export const PATCH   = proxyRequest;
export const DELETE  = proxyRequest;
export const OPTIONS = proxyRequest;
