FROM node:18

WORKDIR /app

# Install dependencies.
COPY package.json package-lock.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

# Copy the source files and configuration.
COPY tsconfig.json vite.config.mts ./
COPY src/ ./src/
COPY tests/ ./tests/

# Build the package.
RUN npm run build

# Run tests.
CMD ["npx", "vitest", "run"]
