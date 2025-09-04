FROM osgeo/gdal:ubuntu-small-3.6.0

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy worker script
COPY worker.py .

# Create data directories
RUN mkdir -p /data/uploads /data/outputs

# Make worker executable
RUN chmod +x worker.py

CMD ["python3", "worker.py"]
