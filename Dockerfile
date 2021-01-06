# Pull official base image
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent

# Add app
COPY umbrella.js ./

# Start app
CMD ["node", "umbrella.js", "--tweet"]
