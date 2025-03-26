# route-url

A minimal, observable-based URL management library supporting browser, server, and in-memory routing. Built with TypeScript and ESM.

```bash
route-url/
├── src/
│   ├── RouteUrl.ts
│   ├── BrowserRouteUrlLegacy.ts
│   ├── BrowserRouteUrlNavigate.ts
│   ├── ServerRouteUrl.ts
│   ├── InMemoryRouteUrl.ts
│   ├── createRouteUrl.ts
│   ├── resolveUrl.ts
│   └── types/
│       └── navigation.ts
├── dist/
│   ├── index.js
│   ├── index.d.ts
│   ├── BrowserRouteUrlNavigate.js
│   ├── BrowserRouteUrlNavigate.d.ts
│   ├── BrowserRouteUrlLegacy.js
│   ├── BrowserRouteUrlLegacy.d.ts
│   ├── ServerRouteUrl.js
│   ├── ServerRouteUrl.d.ts
│   ├── InMemoryRouteUrl.js
│   └── InMemoryRouteUrl.d.ts
├── package.json
├── README.md
├── .gitignore
├── tsconfig.json
└── vitest.config.js
```

## Features

- 🔄 Observable-based URL state management
- 🌐 Platform-specific implementations (Browser, Server, In-Memory)
- 🎯 Type-safe route parameter extraction
- 🔍 Query parameter handling
- ⚡ Modern Navigation API support with fallback
- 🎨 Configurable routing options (hash routing, base URL, trailing slashes)

## Installation

```bash
npm install route-url
```

## Quick Start

```typescript
import { createRouteUrl } from 'route-url';

// Create a browser-based router
const router = createRouteUrl({
  baseUrl: '/app',
  hashRouting: false
});

// Subscribe to URL changes
router.subscribe((routeUrl) => {
  console.log('Current path:', routeUrl.getPath());
  console.log('Query params:', routeUrl.getQuery());
});

// Navigate programmatically
router.navigate('/users/123');

// Extract route parameters
const params = router.getParams('/users/:id');
console.log(params.id); // "123"

// Handle specific routes
router.when('/dashboard').subscribe((routeUrl) => {
  console.log('Dashboard route activated!');
  console.log('Current path:', routeUrl.getPath());
});
```

## API Reference

### Core Methods

#### Router Instance Methods
- `navigate(path: string)`: Navigate to a new URL
- `replace(path: string)`: Replace current URL without adding to history
- `createRouteUrl()`: Create a RouteUrl instance with current URL state
- `subscribe(observer)`: Subscribe to URL changes
- `when(path: string)`: Subscribe to specific route changes
- `back()`: Navigate back
- `forward()`: Navigate forward

#### RouteUrl Instance Methods
- `getPath(removeBasePath?: boolean)`: Get current path (strips baseUrl if present)
  ```typescript
  // Without baseUrl
  router.setUrl('/users/123');
  routeUrl.getPath(); // "/users/123"
  routeUrl.getPath(false); // "/users/123"

  // With baseUrl: '/api'
  router.setUrl('/api/users/123');
  routeUrl.getPath(); // "/users/123" (default: removeBasePath = true)
  routeUrl.getPath(false); // "/api/users/123" (keep baseUrl)
  ```

- `getParams(pattern: string)`: Extract route parameters
  ```typescript
  router.setUrl('/users/123/posts/456');
  const params = routeUrl.getParams('/users/:userId/posts/:postId');
  // { userId: "123", postId: "456" }
  ```

- `getQuery()`: Get URL query parameters (strips baseUrl if present)
  ```typescript
  // Without baseUrl
  router.setUrl('/users?page=1&limit=10');
  routeUrl.getQuery().get('page'); // "1"
  routeUrl.getQuery().get('limit'); // "10"

  // With baseUrl: '/api'
  router.setUrl('/api/users?page=1&limit=10');
  routeUrl.getQuery().get('page'); // "1"
  routeUrl.getQuery().get('limit'); // "10"
  ```

- `url`: Get the current URL object
- `stale`: Check if the URL state is stale (has been updated since creation)

### Configuration Options

```typescript
interface RouteUrlOptions {
  hashRouting?: boolean;      // Use hash-based routing
  baseUrl?: string;          // Base URL for all routes
  relativeUrls?: boolean;    // Use relative URLs
  trailingSlash?: 'ignore' | 'require' | 'forbid';  // Trailing slash behavior
}
```

### Platform-Specific Imports

```typescript
// Browser (Modern Navigation API)
import { BrowserRouteUrlNavigate } from 'route-url/browser';

// Browser (Legacy)
import { BrowserRouteUrlLegacy } from 'route-url/browser-legacy';

// Server
import { ServerRouteUrl } from 'route-url/server';

// In-Memory
import { InMemoryRouteUrl } from 'route-url/in-memory';
```

## Examples

### Basic Browser Routing

```typescript
import { createRouteUrl } from 'route-url';

const router = createRouteUrl();

// Handle navigation
router.subscribe((routeUrl) => {
  const path = routeUrl.getPath();
  if (path === '/users') {
    // Show users page
  } else if (path.startsWith('/users/')) {
    const { id } = routeUrl.getParams('/users/:id');
    // Show user profile
  }
});

// Navigate
router.navigate('/users/123');
```

### Server-Side Routing

```typescript
import { ServerRouteUrl } from 'route-url/server';

const router = new ServerRouteUrl('/initial-path');

// Handle route changes
router.subscribe((routeUrl) => {
  const path = routeUrl.getPath();
  // Handle server-side routing logic
});

// Navigate
router.navigate('/new-path');
```

### In-Memory Testing

```typescript
import { InMemoryRouteUrl } from 'route-url/in-memory';

const router = new InMemoryRouteUrl('/');

// Test navigation
router.navigate('/test');
const routeUrl = router.createRouteUrl();
const currentPath = routeUrl.getPath();
console.log(currentPath); // "/test"

// Test back/forward
router.navigate('/forward');
router.back();
const routeUrl = router.createRouteUrl();
const currentPath = routeUrl.getPath();
console.log(currentPath); // "/test"
```

## License

MIT

