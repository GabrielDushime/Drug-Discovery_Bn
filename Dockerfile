FROM node:18

# Install Python & dependencies
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install packages in the virtual environment
RUN pip install --no-cache-dir numpy openmm

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Start the application
CMD ["npm", "run", "start:dev"]