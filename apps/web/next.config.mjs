/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace engine packages ship compiled ESM in dist/, but transpiling them
  // here lets Next bundle them cleanly across the monorepo without prebuild order issues.
  transpilePackages: [
    '@arc/shared',
    '@arc/engine-core',
    '@arc/engine-automata',
    '@arc/engine-simulation',
    '@arc/engine-animation',
  ],
};

export default nextConfig;
