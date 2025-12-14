import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { serializer } from "../serializer";

/**
 * Creates a new QueryClient instance with oRPC-compatible configuration
 * Includes SSR hydration support and custom serialization
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Hash query keys using oRPC serializer for consistency
        queryKeyHashFn(queryKey) {
          const [json, meta] = serializer.serialize(queryKey);
          return JSON.stringify({ json, meta });
        },
        // Prevent immediate refetching on mount for SSR
        staleTime: 60 * 1000, // 1 minute
      },
      dehydrate: {
        // Include pending queries in dehydration for SSR
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        // Serialize data using oRPC serializer
        serializeData(data) {
          const [json, meta] = serializer.serialize(data);
          return { json, meta };
        },
      },
      hydrate: {
        // Deserialize data using oRPC serializer
        deserializeData(data) {
          return serializer.deserialize(data.json, data.meta);
        },
      },
    },
  });
}
