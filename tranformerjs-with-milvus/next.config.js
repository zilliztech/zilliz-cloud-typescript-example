/** @type {import('next').NextConfig} */

const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const nextConfig = {
  reactStrictMode: false,

  // Indicate that these packages should not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: [
      "sharp",
      "onnxruntime-node",
      "@zilliz/milvus2-sdk-node",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Copy the proto files to the server build directory
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(
                __dirname,
                "node_modules/@zilliz/milvus2-sdk-node/dist"
              ),
              to: path.join(__dirname, ".next"),
            },
          ],
        })
      );
    }
    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
