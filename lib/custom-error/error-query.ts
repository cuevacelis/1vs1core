/**
 * Custom error class for handling query-related errors, such as API or network failures.
 *
 * Allows attaching an optional status code and additional error information.
 *
 * Example:
 * ```ts
 * throw new ErrorQuery({
 *   message: 'Failed to fetch data',
 *   statusCode: 404,
 *   error: responseError,
 * });
 * ```
 */
export class ErrorQuery extends Error {
	statusCode?: number;
	error?: unknown;
	constructor({
		message,
		statusCode,
		error,
	}: {
		message: string;
		statusCode?: number;
		error?: unknown;
	}) {
		super(message);

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ErrorQuery);
		}

		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.error = error;
	}
}
