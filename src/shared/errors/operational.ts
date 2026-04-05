export type OperationalFieldError = {
  field: string;
  message: string;
};

export type OperationalErrorInput = {
  code: string;
  message?: string;
  userMessage?: string;
  path?: string;
  status?: number;
  requestId?: string | null;
  fieldErrors?: OperationalFieldError[];
  cause?: unknown;
};

export class OperationalError extends Error {
  readonly code: string;
  readonly userMessage: string;
  readonly path?: string;
  readonly status?: number;
  readonly requestId?: string | null;
  readonly fieldErrors: OperationalFieldError[];

  constructor(input: OperationalErrorInput) {
    const message = input.message ?? input.userMessage ?? input.code;

    super(message);
    this.name = "OperationalError";
    this.code = input.code;
    this.userMessage = input.userMessage ?? message;
    this.path = input.path;
    this.status = input.status;
    this.requestId = input.requestId;
    this.fieldErrors = input.fieldErrors ?? [];

    if (input.cause !== undefined) {
      Reflect.set(this, "cause", input.cause);
    }
  }
}

export function isOperationalError(error: unknown): error is OperationalError {
  return error instanceof OperationalError;
}

export function toOperationalError(
  error: unknown,
  fallback?: Partial<OperationalErrorInput>,
): OperationalError {
  if (isOperationalError(error)) {
    return error;
  }

  const fallbackMessage =
    fallback?.message ??
    fallback?.userMessage ??
    "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

  return new OperationalError({
    code: fallback?.code ?? "UNEXPECTED_FRONTEND_ERROR",
    message: fallbackMessage,
    userMessage: fallback?.userMessage ?? fallbackMessage,
    path: fallback?.path,
    status: fallback?.status,
    requestId: fallback?.requestId,
    fieldErrors: fallback?.fieldErrors ?? [],
    cause: error,
  });
}

export function getUserMessage(error: unknown, fallback: string): string {
  if (isOperationalError(error)) {
    return error.userMessage;
  }

  return fallback;
}

export function getFieldErrorMessage(
  error: unknown,
  field: string,
): string | null {
  if (!isOperationalError(error)) {
    return null;
  }

  return error.fieldErrors.find((fieldError) => fieldError.field === field)?.message ?? null;
}
