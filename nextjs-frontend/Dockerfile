FROM node:20-bookworm

# Set the working directory and set ownership
WORKDIR /app
RUN chown -R node:node /app

# Install pnpm globally
RUN npm install -g pnpm

# Switch to the non-root user
USER node

# Copy package files and install dependencies
COPY --chown=node:node package*.json ./

# Install dependencies as node user
RUN pnpm install

# Copy the rest of your application code
COPY --chown=node:node . .

EXPOSE 3000

# Start the application
CMD ["./start.sh"]