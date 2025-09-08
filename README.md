# EO/SAR Split-View Map with AOI Clip & Align

A full-stack web application for processing and aligning Earth Observation (EO) and Synthetic Aperture Radar (SAR) satellite imagery. Users can upload two GeoTIFF images, draw an Area of Interest (AOI), and process them to create clipped and aligned versions for comparison using an interactive split-view map.

## Demo
![Screen Recording 2025-09-08 at 10 48 59 AM](https://github.com/user-attachments/assets/b0ed1852-125a-4527-ab50-221e75ba366f)


## Features

### Interactive Map Interface
- **Split-View Visualization**: Side-by-side comparison of two GeoTIFF images using Leaflet with `leaflet-side-by-side` plugin
- **Interactive AOI Drawing**: Draw Area of Interest rectangles by holding Cmd/Ctrl and dragging on the map
- **Real-time Map Updates**: Live visualization of both original and processed images
- **Responsive Design**: Clean, modern UI with Tailwind CSS

### Image Processing Pipeline
- **Automatic Clipping**: Clips both images to the specified AOI bounds using rasterio
- **Image Alignment**: Aligns Image B to Image A using phase cross-correlation from scikit-image
- **Coordinate System Handling**: Properly handles WGS84 to image CRS transformations
- **Fallback Processing**: Gracefully handles alignment failures

### Job Management
- **Asynchronous Processing**: Background job processing with real-time status updates
- **Job Status Tracking**: Visual status indicators (Idle, Pending, Running, Done, Error)
- **Output Toggle**: Switch between original and processed images seamlessly
- **Error Handling**: Comprehensive error reporting and validation

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite for fast development and building
- **Mapping**: Leaflet with `leaflet-side-by-side` for split-view functionality
- **GeoTIFF Handling**: `georaster` and `georaster-layer-for-leaflet` for raster visualization
- **Styling**: Tailwind CSS for responsive design
- **HTTP Client**: Axios for API communication

### Backend (Node.js + Express)
- **API Server**: Express.js with CORS support
- **File Handling**: Multer for multipart file uploads
- **Job Management**: JSON-based job queue with UUID tracking
- **File Storage**: Organized upload and output directories

### Worker (Python)
- **Image Processing**: Rasterio for GeoTIFF manipulation
- **Alignment Algorithm**: Phase cross-correlation from scikit-image
- **Coordinate Systems**: GDAL for CRS transformations
- **Dependencies**: NumPy for numerical operations

### Containerization
- **Docker Compose**: Multi-service orchestration
- **Shared Volumes**: Persistent data storage across containers
- **Network**: Bridge network for service communication

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd eo-sar-align
   ```

2. **Start the application**:
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   - **Web Interface**: http://localhost:3000
   - **API**: http://localhost:8080

## 📖 Usage Instructions

### 1. Upload Images
- Click "Choose File" for both Image A and Image B
- Select GeoTIFF files (.tif or .tiff)
- Wait for upload completion (status indicators will show progress)

### 2. Draw Area of Interest
- Hold **Cmd** (Mac) or **Ctrl** (Windows/Linux)
- Click and drag on the map to draw a rectangle
- The AOI will be highlighted in red

### 3. Process Images
- Click "Process AOI" to start the processing job
- Monitor the job status in real-time
- Processing includes:
  - Clipping both images to AOI bounds
  - Aligning Image B to Image A using phase cross-correlation
  - Generating output files

### 4. View Results
- Toggle "Show processed outputs" to switch between original and processed images
- Compare the aligned results in the split-view map

## 🔧 API Reference

### Upload Image
```http
POST /api/upload
Content-Type: multipart/form-data

Body: file (GeoTIFF)
Response: { "imageId": "uuid", "filename": "image.tif", "size": 12345 }
```

### Create Processing Job
```http
POST /api/jobs
Content-Type: application/json

Body: {
  "imageAId": "uuid-a",
  "imageBId": "uuid-b", 
  "aoi": {
    "north": 40.7128,
    "south": 40.7589,
    "east": -74.0059,
    "west": -73.9442
  }
}
Response: { "jobId": "job-uuid" }
```

### Get Job Status
```http
GET /api/jobs/:jobId

Response: {
  "jobId": "job-uuid",
  "status": "Done",
  "imageAId": "uuid-a",
  "imageBId": "uuid-b",
  "aoi": { ... },
  "outputs": {
    "imageAUrl": "/data/outputs/job-uuid/A_clipped.tif",
    "imageBUrl": "/data/outputs/job-uuid/B_clipped_aligned.tif"
  },
  "error": null
}
```

### Get Image URL
```http
GET /api/images/:imageId

Response: File stream (GeoTIFF)
```

## 🧠 Image Processing Pipeline

### 1. Image Clipping
- **Input**: Original GeoTIFF files and AOI bounds in WGS84
- **Process**: 
  - Transform AOI bounds from WGS84 to image coordinate system
  - Use `rasterio.mask` for precise geometric clipping
  - Maintain original data types and metadata
- **Output**: Clipped images saved as `A_clipped.tif` and `B_clipped.tif`

### 2. Image Alignment
- **Method**: Phase cross-correlation from scikit-image
- **Process**:
  1. Normalize both images to zero mean and unit variance
  2. Compute phase cross-correlation with upsampling for sub-pixel accuracy
  3. Apply detected translation using affine transformation
  4. Fall back to original clipped image if alignment fails
- **Output**: Aligned image saved as `B_clipped_aligned.tif`

### Alignment Algorithm Details

**Phase Cross-Correlation** is used because it:
- Is robust to illumination changes between images
- Works well with different image types (EO vs SAR)
- Provides sub-pixel accuracy
- Handles translation effectively

**Limitations**:
- Only handles translation, not rotation or scaling
- Works best with similar image resolutions
- May struggle with very different image types

## 📁 Project Structure

```
eo-sar-align/
├── web/                          # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── SplitMap.jsx     
│   │   │   ├── UploadPanel.jsx  # File upload interface
│   │   │   ├── ProcessButton.jsx 
│   │   │   ├── JobStatusChip.jsx # Status indicators
│   │   │   └── AOISelector.jsx  # AOI selection utilities
│   │   ├── App.jsx              # Main application component
│   │   ├── api.js               # API client functions
│   │   └── main.jsx             # Application entry point
│   ├── Dockerfile
│   └── nginx.conf               # Nginx configuration
├── api/                          # Node.js backend
│   ├── server.js                # Express server with endpoints
│   ├── package.json
│   └── Dockerfile
├── worker/                       # Python image processing
│   ├── worker.py                # Main processing script
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile
├── data/                        # Shared volume
│   ├── uploads/                 # Uploaded GeoTIFF files
│   ├── outputs/                 # Processed output files
│   └── jobs.json               # Job queue storage
├── docker-compose.yml           # Multi-service orchestration
└── README.md
```

## 🛠️ Development

### Local Development (without Docker)

1. **Backend**:
   ```bash
   cd api
   npm install
   npm start
   ```

2. **Frontend**:
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Worker** (requires Python 3.8+ and GDAL):
   ```bash
   cd worker
   pip install -r requirements.txt
   python worker.py --help
   ```

## ⚠️ Known Limitations

### Technical Limitations
- **Alignment Method**: Only handles translation, not rotation or scaling
- **File Size**: Large GeoTIFFs (>150MB) may cause browser performance issues
- **Coordinate Systems**: Assumes AOI is in WGS84 (EPSG:4326)
- **Image Types**: Works best with similar image types and resolutions
- **Browser Compatibility**: Requires modern browsers with WebGL support

### Performance Considerations
- **Processing Time**: Real image processing takes longer than mock operations
- **Memory Usage**: Large images require significant memory for processing
- **Browser Rendering**: Complex GeoTIFFs may need downsampling for smooth display
- **Network**: Large file uploads may timeout on slow connections

## 🔮 Future Improvements

### Enhanced Alignment
- Support for rotation and scaling in alignment
- Feature-based alignment (SIFT/ORB) for better accuracy
- Multi-scale alignment for different resolutions

### User Experience
- Progressive image loading and tiling
- Drag-and-drop file upload
- Keyboard shortcuts for common actions
- Undo/redo functionality for AOI drawing

### Technical Enhancements
- Support for different coordinate systems
- Batch processing capabilities
- Cloud storage integration
- Real-time collaboration features

## 🐛 Troubleshooting

### Common Issues

1. **Images not loading**:
   - Check file format (must be .tif/.tiff)
   - Verify georeferencing is present
   - Check browser console for errors

2. **Processing fails**:
   - Verify AOI bounds are within image extent
   - Check file permissions in data directory
   - Review worker logs for detailed error messages

3. **Alignment poor**:
   - Images may be too different in type or resolution
   - Try with smaller AOI areas
   - Check if images have sufficient overlap


### Debugging

**View logs**:
```bash
# All services
docker compose logs

# Specific service
docker compose logs web
docker compose logs api
docker compose logs worker
```

**Check data directory**:
```bash
# Verify uploaded files
ls -la data/uploads/

# Check processed outputs
ls -la data/outputs/
```
