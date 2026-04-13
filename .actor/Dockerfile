# Use the official Apify image for Node.js
FROM apify/actor-node:20

# Copy all files into the container
COPY . ./

# Install the parts list (package.json)
RUN npm install --silent

# Tell the container how to start your bot
CMD ["npm", "start"]
