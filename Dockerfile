FROM node:20-slim

WORKDIR /app

# Copy dependency definitions
COPY package*.json bun.lock* ./

# Install all dependencies (including devDependencies needed for Vite build)
RUN npm install

# Copy source code and build the production bundle
COPY . .
RUN npm run build

# Set environment variables for Cloud Run
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# Serve the production build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
