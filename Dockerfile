# Use the official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port for health checks
EXPOSE 8080

# Set environment variables for memory limits
ENV NODE_OPTIONS="--max-old-space-size=230"

# Command to run the bot and the health check server
CMD ["node", "--expose-gc", "index.js"]
