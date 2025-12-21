/**
 * Maps an array of errors to their string messages.
 * If the error is a string, returns it directly. If it's an object with a message, returns the message. Otherwise, stringifies the error.
 * @example
 *   mapErrorMessages(["Error simple", { message: "Error complejo" }]) // ["Error simple", "Error complejo"]
 */
export const mapErrorMessages = (errors: unknown[]): string[] =>
  errors.map((err) =>
    typeof err === "string"
      ? err
      : typeof err === "object" && err !== null && "message" in err
        ? (err as { message: string }).message
        : String(err),
  );
