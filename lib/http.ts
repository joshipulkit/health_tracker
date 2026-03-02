import { ZodSchema } from "zod";

export function jsonOk(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json(
    {
      error: message,
      details
    },
    { status }
  );
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        response: jsonError("Invalid request payload", 400, parsed.error.flatten())
      };
    }
    return { success: true, data: parsed.data };
  } catch {
    return { success: false, response: jsonError("Request body must be valid JSON", 400) };
  }
}
