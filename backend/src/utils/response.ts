import { HttpResponseInit } from '@azure/functions'

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function okResponse(data: unknown): HttpResponseInit {
  return {
    status: 200,
    headers: BASE_HEADERS,
    jsonBody: data,
  }
}

export function createdResponse(data: unknown): HttpResponseInit {
  return {
    status: 201,
    headers: BASE_HEADERS,
    jsonBody: data,
  }
}

export function badRequest(message: string): HttpResponseInit {
  return {
    status: 400,
    headers: BASE_HEADERS,
    jsonBody: { error: message },
  }
}

export function unauthorized(message = 'Unauthorized'): HttpResponseInit {
  return {
    status: 401,
    headers: BASE_HEADERS,
    jsonBody: { error: message },
  }
}

export function forbidden(message = 'Forbidden'): HttpResponseInit {
  return {
    status: 403,
    headers: BASE_HEADERS,
    jsonBody: { error: message },
  }
}

export function notFound(message = 'Not found'): HttpResponseInit {
  return {
    status: 404,
    headers: BASE_HEADERS,
    jsonBody: { error: message },
  }
}

export function internalServerError(message = 'Unexpected server error'): HttpResponseInit {
  return {
    status: 500,
    headers: BASE_HEADERS,
    jsonBody: { error: message },
  }
}
