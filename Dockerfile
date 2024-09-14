# Use the official Node.js 20 runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the application code into the container
COPY . .

# Expose the port for the health check server
EXPOSE 8080

# Set environment variables for memory limits
ENV NODE_OPTIONS="--max-old-space-size=230" # Set to lower than 256MB to ensure safe execution

# Command to run the bot and the health check server
CMD ["node", "--expose-gc", "index.js"]
