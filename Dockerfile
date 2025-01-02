# Use Puppeteer base image with Chromium pre-installed
FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install dependencies
# Use npm ci if package-lock.json is present, otherwise fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the application code into the container
COPY . .

# Expose the necessary port (if your app uses one, e.g., 3000)
EXPOSE 3000

# Command to run the application
CMD ["node", "index.js"]
