# ==========================================================
# CURO MEDICAL MANAGEMENT SYSTEM - PRODUCTION DOCKERFILE
# DeployWise & Container PaaS Ready
# ==========================================================

FROM node:22-alpine

WORKDIR /app

# Cache package installation layer
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Container healthcheck for DeployWise load balancers
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/status', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "server.js"]
