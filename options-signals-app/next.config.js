/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prevent Next.js from bundling yahoo-finance2 — its ESM build imports
  // Deno-only modules (@std/testing/mock) that don't exist in Node.js.
  serverExternalPackages: ['yahoo-finance2'],
};

module.exports = nextConfig;
