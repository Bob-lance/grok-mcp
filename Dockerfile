# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Increase memory limit for the build process (optional, keep if needed)
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build the TypeScript code
RUN npm run build

# Optional: Prune devDependencies if you want to copy node_modules later
# RUN npm prune --production

# Stage 2: Create the final production image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the builder stage
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder /app/build ./build

# Make port 3000 available
EXPOSE 3000

# Define environment variables if needed (e.g., for runtime)
# ENV NODE_ENV=production

# Run the app
CMD [ "npm", "start" ] 