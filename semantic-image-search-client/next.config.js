/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    // Ignore node-specific modules when bundling for the browser
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
  // Indicate that these packages should not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: ["@zilliz/milvus2-sdk-node"],
    outputFileTracingIncludes: {
      // When deploying to Vercel, the following configuration is required
      "/api/**/*": ["node_modules/@zilliz/milvus2-sdk-node/dist/proto/**/*"],
    },
  },
};

module.exports = nextConfig;
