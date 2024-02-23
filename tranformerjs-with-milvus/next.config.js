/** @type {import('next').NextConfig} */

const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone", // Feel free to modify/remove this option

  // Indicate that these packages should not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: ["sharp", "onnxruntime-node"],
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
