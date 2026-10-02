/** Envelope returned by every API route. Shared with client code. */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  message: string;
  /** Field-level validation messages keyed by dotted path, e.g. `images.0.url`. */
  errors?: Record<string, string>;
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
