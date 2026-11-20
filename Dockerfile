# Use Node.js LTS base image
FROM node:20-slim

# Install system dependencies
# - python3, python3-pip: required by yt-dlp & curl-cffi TLS impersonation
# - ffmpeg: required for video slicing & audio extraction
# - curl, ca-certificates: TLS root certificates
# - fontconfig, fonts-dejavu, fonts-indic: required for subtitle/caption burn-in and multilingual Hindi/Indian support
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    curl \
    ca-certificates \
    fontconfig \
    fonts-dejavu \
    fonts-indic \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install modern yt-dlp with curl-cffi browser TLS impersonation and updated certifi
RUN pip3 install --no-cache-dir --break-system-packages -U "yt-dlp[default,curl-cffi]" certifi

# Set up non-root directory using the image's pre-configured node user (UID 1000)
WORKDIR /home/node/app

# Ensure yt-dlp is available in /home/node/bin and PATH
RUN mkdir -p /home/node/bin && \
    ln -sf $(which yt-dlp) /home/node/bin/yt-dlp && \
    chown -R node:node /home/node/bin

# Add the user's bin folder to the environment PATH
ENV PATH="/home/node/bin:${PATH}"

# Copy package files and install dependencies as node user
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy the rest of the application files
COPY --chown=node:node . .

# Create necessary directories and ensure they are owned by the node user
RUN mkdir -p downloads clips exports fonts fontcache public/assets && chown -R node:node /home/node/app

# Switch to node user
USER node

# Set environment variables (7860 is Hugging Face Spaces default port)
ENV PORT=7860
ENV NODE_ENV=production

# Expose ports (7860 for Hugging Face Spaces, 3000 as secondary)
EXPOSE 7860
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
