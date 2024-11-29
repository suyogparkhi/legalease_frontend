import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  // Get the response from the origin
  const response = await context.next();

  // Create a new response with CORS headers
  const newResponse = new Response(response.body, response);

  // Add CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', 'https://legalease-backend-35ws.onrender.com');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

  return newResponse;
};

export const config = {
  path: "/*",
};