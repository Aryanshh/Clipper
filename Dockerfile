# Use Node.js LTS base image
FROM node:20-slim

# Install system dependencies
# - python3: required by yt-dlp
# - ffmpeg: required for video slicing & audio extraction
# - curl: to download yt-dlp
# - fontconfig & fonts-dejavu: required for subtitle/caption burn-in
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    fontconfig \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root directory using the image's pre-configured node user (UID 1000)
WORKDIR /home/node/app

# Download yt-dlp to user's home/bin folder where it is writable and can be auto-updated
RUN mkdir -p /home/node/bin && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /home/node/bin/yt-dlp && \
    chmod a+rx /home/node/bin/yt-dlp && \
    chown -R node:node /home/node/bin

# Add the user's bin folder to the environment PATH
ENV PATH="/home/node/bin:${PATH}"

# Copy package files and install dependencies as node user
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy the rest of the application files
COPY --chown=node:node . .

# Create necessary directories and ensure they are owned by the node user
RUN mkdir -p downloads clips exports && chown -R node:node /home/node/app

# Switch to node user
USER node

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
