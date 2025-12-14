import { StandardRPCJsonSerializer } from "@orpc/client/standard";

/**
 * JSON serializer for oRPC with TanStack Query
 * Handles serialization/deserialization for SSR hydration
 */
export const serializer = new StandardRPCJsonSerializer({
  customJsonSerializers: [
    // Add custom serializers here if needed
    // Example: Date serialization, BigInt, etc.
  ],
});
