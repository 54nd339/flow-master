import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import type { RuntimeCaching } from "workbox-build";

const runtimeCaching: RuntimeCaching[] = [
  {
    urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
    handler: "NetworkFirst",
    options: {
      cacheName: "pages",
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ request }: { request: Request }) =>
      ["script", "style", "worker"].includes(request.destination),
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-resources",
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ request }: { request: Request }) => request.destination === "image",
    handler: "CacheFirst",
    options: {
      cacheName: "images",
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ url }: { url: URL }) =>
      url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/icon.svg" ||
      url.pathname === "/icon-192.svg" ||
      url.pathname === "/icon-512.svg" ||
      url.pathname === "/apple-touch-icon.svg",
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "app-metadata",
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching,
  },
})(nextConfig);
