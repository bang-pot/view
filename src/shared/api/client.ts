import {
  OperationalError,
  type OperationalErrorInput,
  type OperationalFieldError,
  toOperationalError,
} from "@/shared/errors/operational";

type ApiErrorContract = {
  code: string;
  message: string;
  requestId: string;
  fieldErrors: OperationalFieldError[];
};

type RequestErrorMeta = Pick<OperationalErrorInput, "code" | "message" | "userMessage">;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFieldErrors(value: unknown): OperationalFieldError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isObject(entry)) {
      return [];
    }

    const field = entry.field;
    const message = entry.message;

    if (typeof field !== "string" || typeof message !== "string") {
      return [];
    }

    return [{ field, message }];
  });
}

function parseApiErrorContract(body: unknown): ApiErrorContract | null {
  if (!isObject(body)) {
    return null;
  }

  const code = body.code;
  const message = body.message;
  const requestId = body.requestId;

  if (
    typeof code !== "string" ||
    typeof message !== "string" ||
    typeof requestId !== "string" ||
    !Array.isArray(body.fieldErrors)
  ) {
    return null;
  }

  return {
    code,
    message,
    requestId,
    fieldErrors: normalizeFieldErrors(body.fieldErrors),
  };
}

async function safeReadJson(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}

async function toResponseError(
  response: Response,
  path: string,
  errorMeta: RequestErrorMeta,
): Promise<OperationalError> {
  const requestIdFromHeader = response.headers.get("X-Request-Id");
  const body = await safeReadJson(response);
  const contract = parseApiErrorContract(body);

  if (contract) {
    return new OperationalError({
      code: contract.code,
      message: contract.message,
      userMessage: contract.message,
      requestId: contract.requestId,
      fieldErrors: contract.fieldErrors,
      status: response.status,
      path,
    });
  }

  const fallbackMessage = errorMeta.message ?? errorMeta.userMessage ?? errorMeta.code;

  return new OperationalError({
    code: errorMeta.code,
    message: fallbackMessage,
    userMessage: errorMeta.userMessage ?? fallbackMessage,
    requestId: requestIdFromHeader,
    fieldErrors: [],
    status: response.status,
    path,
  });
}

export async function requestJson<T>(
  url: string,
  path: string,
  init: RequestInit,
  errorMeta: RequestErrorMeta,
): Promise<T> {
  try {
    const response = await fetch(`${url}${path}`, init);

    if (!response.ok) {
      throw await toResponseError(response, path, errorMeta);
    }

    return (await response.json()) as T;
  } catch (error) {
    throw toOperationalError(error, {
      ...errorMeta,
      path,
      fieldErrors: [],
    });
  }
}
