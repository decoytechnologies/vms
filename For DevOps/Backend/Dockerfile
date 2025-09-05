# syntax=docker/dockerfile:1

# ---- Base image ----
    FROM node:18-alpine AS base
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Install dependencies (only package.json and lock first for better caching)
    COPY package*.json ./
    RUN npm ci --only=production
    
    # Copy source
    COPY src ./src
    # .sequelizerc is optional; omit to avoid COPY errors if absent
    COPY env.example ./env.example
    
    # Expose
    EXPOSE 8080
    
    # Healthcheck (simple TCP)
    HEALTHCHECK --interval=30s --timeout=3s --start-period=20s CMD node -e "require('net').connect(8080).on('connect',()=>{console.log('ok');process.exit(0)}).on('error',()=>process.exit(1))"
    
    # Run
    CMD ["node", "src/server.js"]
    