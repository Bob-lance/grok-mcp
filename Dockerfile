# Use an official Node.js runtime as a parent image
# Using Alpine Linux for a smaller image size
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
# Use --link to optimize caching if available
COPY package*.json ./

# Install dependencies using npm ci for clean installs
# Use --omit=dev to skip installing devDependencies in the final image
RUN npm ci --omit=dev

# Copy the rest of the application source code
COPY . .

# Increase memory limit for the build process
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build the TypeScript code
RUN npm run build

# Reset NODE_OPTIONS if not needed for runtime
# ENV NODE_OPTIONS=

# Make port 3000 available to the world outside this container
# Change this if your app uses a different port
EXPOSE 3000

# Define environment variables if needed
# ENV NODE_ENV production

# Run the app when the container launches
CMD [ "npm", "start" ] 