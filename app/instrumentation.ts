export async function register() {
  // Initialize server-side oRPC client for SSR optimization
  // This creates a direct router client that avoids HTTP overhead
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../lib/orpc/orpc.server");
  }
}
