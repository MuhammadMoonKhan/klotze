# Base image with Node.js
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Install system dependencies and Chromium
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  libstdc++ \
  libx11 \
  libxcomposite \
  libxrandr \
  libxi \
  libxtst \
  libpangocairo \
  libxdamage \
  libcups \
  libnss3 \
  alsa-lib \
  at-spi2-core \
  dbus \
  ttf-dejavu \
  ffmpeg

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 9090

# Command to run the app
CMD ["node", "index.js"]
