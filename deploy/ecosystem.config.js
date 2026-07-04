module.exports = {
  apps: [
    {
      name: "shan-server",
      script: "./ShanServer/index.js",
      cwd: "/var/www/shankoemee",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};