FROM continuumio/miniconda3

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create conda environment with OpenMM and other scientific packages
RUN conda create -n openmm_env -c conda-forge openmm numpy pandas dask distributed -y
RUN echo "source activate openmm_env" > ~/.bashrc
ENV PATH /opt/conda/envs/openmm_env/bin:$PATH

# Install conda-forge
RUN conda config --add channels conda-forge
RUN conda config --set channel_priority strict

# Activate conda environment by default
SHELL ["conda", "run", "-n", "openmm_env", "/bin/bash", "-c"]

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Make sure Python scripts are executable
RUN chmod +x ./src/scripts/*.py

# Create a shell script that activates conda env before starting the app
RUN echo '#!/bin/bash\nconda activate openmm_env\nnpm run start:dev' > start.sh
RUN chmod +x start.sh

CMD ["./start.sh"]