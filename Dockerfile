FROM node:18

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Ensure python3 is the default python command
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Optional: Install any Python dependencies if needed
# COPY requirements.txt ./
# RUN pip3 install -r requirements.txt

CMD ["npm", "run", "start:dev"]