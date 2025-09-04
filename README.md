# EO/SAR Split-View Map with AOI Clip & Align

A full-stack web application for processing and aligning Earth Observation (EO) and Synthetic Aperture Radar (SAR) satellite imagery. Users can upload two GeoTIFF images, draw an Area of Interest (AOI), and process them to create clipped and aligned versions for comparison.

## Features

- **Split-view Map**: Side-by-side visualization of two GeoTIFF images using Leaflet
- **AOI Selection**: Interactive drawing of Area of Interest rectangles on the map
- **Image Processing**: Automatic clipping and alignment of images using Python backend
- **Real-time Status**: Job status tracking with polling updates
- **Output Visualization**: Toggle between original and processed images

## Architecture

- **Frontend**: React with Vite, Leaflet for mapping, georaster for GeoTIFF handling
- **Backend**: Node.js/Express API for file handling and job orchestration
- **Worker**: Python with rasterio, scikit-image for image processing
- **Containerization**: Docker Compose for easy deployment

## Quick Start

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
   - Web interface: http://localhost:3000
   - API: http://localhost:8080

## API Endpoints

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

## Image Processing Pipeline

The Python worker performs the following steps:

### 1. Image Clipping
- Clips both input images to the specified AOI bounds
- Handles coordinate system transformations from WGS84 to image CRS
- Uses `rasterio.mask` for precise geometric clipping

### 2. Image Alignment
- Aligns Image B to Image A using **phase cross-correlation**
- Normalizes images for better correlation matching
- Applies affine transformation based on detected shift
- Falls back to original image if alignment fails

### Alignment Method

The application uses **phase cross-correlation** from scikit-image for image registration:

- **Advantages**: Robust to illumination changes, works well with different image types (EO vs SAR)
- **Process**: 
  1. Normalize both images to zero mean and unit variance
  2. Compute phase cross-correlation with upsampling for sub-pixel accuracy
  3. Apply detected translation using affine transformation
- **Limitations**: Only handles translation, not rotation or scaling

## Usage Instructions

1. **Upload Images**: Select two GeoTIFF files (Image A and Image B)
2. **View Images**: Images appear in split-view map for comparison
3. **Draw AOI**: Click on the map to place an Area of Interest rectangle
4. **Process**: Click "Process AOI" to start clipping and alignment
5. **Monitor**: Watch job status updates in real-time
6. **View Results**: Toggle "Show processed outputs" to see aligned images

## File Structure

```
eo-sar-align/
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   └── api.js      # API client
│   ├── Dockerfile
│   └── nginx.conf
├── api/                 # Node.js backend
│   ├── server.js       # Express server
│   └── Dockerfile
├── worker/              # Python image processing
│   ├── worker.py       # Main processing script
│   ├── requirements.txt
│   └── Dockerfile
├── data/               # Shared volume (uploads/outputs)
├── docker-compose.yml
└── README.md
```

## Known Limitations & Tradeoffs

### Technical Limitations
- **Alignment Method**: Only handles translation, not rotation or scaling
- **File Size**: Large GeoTIFFs (>150MB) may cause browser performance issues
- **Coordinate Systems**: Assumes AOI is in WGS84 (EPSG:4326)
- **Image Types**: Works best with similar image types and resolutions

### Performance Tradeoffs
- **Processing Time**: Real image processing takes longer than mock operations
- **Memory Usage**: Large images require significant memory for processing
- **Browser Rendering**: Complex GeoTIFFs may need downsampling for smooth display

### Future Improvements
- Support for rotation and scaling in alignment
- Feature-based alignment (SIFT/ORB) for better accuracy
- Progressive image loading and tiling
- Support for different coordinate systems
- Batch processing capabilities

## Development

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

### Testing with Sample Data

The application works with any GeoTIFF files. For testing, you can use:
- Sentinel-2 optical imagery (EO)
- Sentinel-1 SAR imagery
- Landsat imagery
- Any other GeoTIFF with proper georeferencing

## Troubleshooting

### Common Issues

1. **Images not loading**: Check file format (must be .tif/.tiff) and georeferencing
2. **Processing fails**: Verify AOI bounds are within image extent
3. **Alignment poor**: Images may be too different in type or resolution
4. **Docker issues**: Ensure Docker has sufficient memory allocated

### Logs

- **API logs**: `docker compose logs api`
- **Worker logs**: `docker compose logs worker`
- **Web logs**: `docker compose logs web`

## License

This project is for educational and research purposes.
