/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remova as configurações de output e basePath
  images: {
    domains: ['cdn.prod.website-files.com'], // Adicione este domínio para permitir imagens externas
  },
};

export default nextConfig;
