/**
 * Configuration options for URL resolution
 */
interface ResolveUrlOptions {
  /** The base URL to prepend to paths */
  baseUrl: string;
  /** Whether to use relative URLs (include baseUrl) or absolute URLs */
  relativeUrls: boolean;
  /** How to handle trailing slashes */
  trailingSlash: "ignore" | "require" | "forbid";
}

/**
 * Resolves a path into a URL object, handling various edge cases and configurations.
 *
 * Edge cases handled:
 * 1. Empty paths and root paths
 * 2. Paths that already include the baseUrl
 * 3. Path traversal attempts (..)
 * 4. Multiple consecutive slashes
 * 5. Trailing slashes based on configuration
 * 6. Unicode characters in paths
 * 7. Special characters in paths
 * 8. Query parameters
 *
 * @param path - The path to resolve
 * @param options - Configuration options for URL resolution
 * @returns A URL object with the resolved path
 */
export function resolveUrl(path: string, options: ResolveUrlOptions): URL {
  const { baseUrl, relativeUrls, trailingSlash } = options;

  // Case 1: Handle empty paths and root paths
  if (!path || path === "/" || path === "//") {
    return new URL(baseUrl || "/", "http://localhost");
  }

  // Case 8: Separate query parameters from path
  const [pathWithoutQuery, queryString] = path.split("?");

  // Case 2: Remove baseUrl if already present to avoid duplication
  const cleanPath = pathWithoutQuery.startsWith(baseUrl)
    ? pathWithoutQuery.slice(baseUrl.length)
    : pathWithoutQuery;

  // Case 3: Handle path traversal attempts
  const segments = cleanPath.split("/").filter(Boolean);
  const resolvedSegments: string[] = [];

  for (const segment of segments) {
    if (segment === "..") {
      resolvedSegments.pop();
    } else if (segment !== ".") {
      resolvedSegments.push(segment);
    }
  }

  // Case 4: Normalize multiple consecutive slashes
  const normalizedPath = resolvedSegments.join("/");

  // Build the resolved path based on configuration
  let resolvedPath = relativeUrls
    ? `${baseUrl}/${normalizedPath}`
    : `/${normalizedPath}`;

  // Case 5: Handle trailing slashes based on configuration
  const hasTrailingSlash = pathWithoutQuery.endsWith("/");
  if (trailingSlash === "require" && !resolvedPath.endsWith("/")) {
    resolvedPath += "/";
  } else if (trailingSlash === "forbid" && resolvedPath.endsWith("/")) {
    resolvedPath = resolvedPath.slice(0, -1);
  } else if (trailingSlash === "ignore") {
    // For ignore mode, only add trailing slash if the original path had one
    // and it's not already present
    if (hasTrailingSlash && !resolvedPath.endsWith("/")) {
      resolvedPath += "/";
    }
  }

  // Case 6 & 7: Handle Unicode and special characters
  // Create URL with a dummy base to avoid encoding issues
  const url = new URL(resolvedPath, "http://localhost");
  // Set the pathname directly to avoid encoding
  url.pathname = decodeURIComponent(resolvedPath);

  // Case 8: Add query parameters back if they exist
  if (queryString) {
    url.search = `?${queryString}`;
  }

  return url;
}
