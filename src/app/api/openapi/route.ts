const document = {
  openapi: "3.1.0",
  info: {
    title: "SDL Patient Catalog API",
    version: "1.0.0",
    description: "Read-only catalog and engagement contract for SDL patient applications.",
  },
  paths: {
    "/api/v1/catalog/tests": {
      get: {
        summary: "List patient-bookable tests",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { "200": { description: "Paginated tests" }, "503": { description: "Catalog unavailable" } },
      },
    },
    "/api/v1/catalog/packages": {
      get: {
        summary: "List active public packages",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { "200": { description: "Paginated packages" }, "503": { description: "Catalog unavailable" } },
      },
    },
    "/api/v1/catalog/packages/{slug}": {
      get: {
        summary: "Get a package by stable slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Package details" }, "404": { description: "Package not found" } },
      },
    },
    "/api/v1/catalog/categories": {
      get: {
        summary: "List categories containing active public packages",
        responses: { "200": { description: "Category list" } },
      },
    },
    "/api/v1/engagement/banners": {
      get: {
        summary: "List live home-screen banners",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { "200": { description: "Paginated home banners" }, "503": { description: "Announcements unavailable" } },
      },
    },
    "/api/v1/engagement/notifications": {
      get: {
        summary: "List live in-app notification announcements",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: { "200": { description: "Paginated inbox announcements" }, "503": { description: "Announcements unavailable" } },
      },
    },
    "/api/health": { get: { summary: "Liveness", responses: { "200": { description: "Alive" } } } },
    "/api/ready": { get: { summary: "Dependency readiness", responses: { "200": { description: "Ready" }, "503": { description: "Not ready" } } } },
    "/api/webhooks/crelio": {
      post: {
        summary: "Reserved CrelioHealth webhook ingress",
        responses: { "501": { description: "Not configured until vendor contract is available" } },
      },
    },
  },
} as const;

export function GET() {
  return Response.json(document, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
