import argparse
import os
import sys
import warnings
warnings.filterwarnings('ignore')

# Try to import required packages, provide helpful error messages if missing
try:
    import numpy as np
except ImportError:
    print("ERROR: numpy is not installed. Please install it with: pip install numpy")
    sys.exit(1)

try:
    import rasterio
    from rasterio.mask import mask
    from rasterio.warp import transform_bounds, calculate_default_transform, reproject, Resampling
    from rasterio.crs import CRS
except ImportError:
    print("ERROR: rasterio is not installed. Please install it with: pip install rasterio")
    sys.exit(1)

try:
    from skimage.registration import phase_cross_correlation
    from skimage.transform import AffineTransform
except ImportError:
    print("ERROR: scikit-image is not installed. Please install it with: pip install scikit-image")
    sys.exit(1)

def parse_aoi(aoi_str):
    """Parse AOI string into bounds dictionary"""
    bounds = {}
    for pair in aoi_str.split(';'):
        key, value = pair.split('=')
        bounds[key] = float(value)
    return bounds

def clip_image_to_aoi(image_path, aoi_bounds, output_path):
    """Clip image to AOI bounds"""
    with rasterio.open(image_path) as src:
        print(f"Image CRS: {src.crs}")
        print(f"Image bounds: {src.bounds}")
        
        # Create AOI geometry in WGS84 (EPSG:4326)
        aoi_geom_wgs84 = {
            "type": "Polygon",
            "coordinates": [[
                [aoi_bounds['west'], aoi_bounds['south']],
                [aoi_bounds['east'], aoi_bounds['south']],
                [aoi_bounds['east'], aoi_bounds['north']],
                [aoi_bounds['west'], aoi_bounds['north']],
                [aoi_bounds['west'], aoi_bounds['south']]
            ]]
        }
        
        # Transform AOI from WGS84 to image CRS
        from rasterio.warp import transform_geom
        try:
            aoi_geom = transform_geom('EPSG:4326', src.crs, aoi_geom_wgs84)
            print(f"Transformed AOI geometry: {aoi_geom}")
        except Exception as e:
            print(f"Error transforming AOI geometry: {e}")
            # Fallback: try to use the original geometry if transformation fails
            aoi_geom = aoi_geom_wgs84
            print("Using original AOI geometry as fallback")
        
        # Validate that AOI intersects with image bounds
        from rasterio.features import bounds
        aoi_bounds_transformed = bounds(aoi_geom)
        print(f"AOI bounds in image CRS: {aoi_bounds_transformed}")
        
        # Check if AOI intersects with image
        if (aoi_bounds_transformed[2] < src.bounds[0] or  # AOI east < image west
            aoi_bounds_transformed[0] > src.bounds[2] or  # AOI west > image east
            aoi_bounds_transformed[3] < src.bounds[1] or  # AOI north < image south
            aoi_bounds_transformed[1] > src.bounds[3]):   # AOI south > image north
            raise ValueError(f"AOI does not intersect with image bounds. AOI: {aoi_bounds_transformed}, Image: {src.bounds}")
        
        # Clip the image
        clipped_image, clipped_transform = mask(src, [aoi_geom], crop=True)
        
        # Update metadata
        clipped_meta = src.meta.copy()
        clipped_meta.update({
            "driver": "GTiff",
            "height": clipped_image.shape[1],
            "width": clipped_image.shape[2],
            "transform": clipped_transform
        })
        
        # Write clipped image
        with rasterio.open(output_path, "w", **clipped_meta) as dst:
            dst.write(clipped_image)
    
    return output_path

def align_images(image_a_path, image_b_path, output_path):
    """Align Image B to Image A using phase cross-correlation"""
    with rasterio.open(image_a_path) as src_a, rasterio.open(image_b_path) as src_b:
        # Read the first band of both images
        img_a = src_a.read(1)
        img_b = src_b.read(1)
        
        # Ensure both images are the same size by resampling B to A's dimensions
        if img_a.shape != img_b.shape:
            # Resample B to match A's dimensions
            img_b_resampled = np.zeros_like(img_a)
            for i in range(img_a.shape[0]):
                for j in range(img_a.shape[1]):
                    # Simple nearest neighbor resampling
                    src_i = int(i * img_b.shape[0] / img_a.shape[0])
                    src_j = int(j * img_b.shape[1] / img_a.shape[1])
                    src_i = min(src_i, img_b.shape[0] - 1)
                    src_j = min(src_j, img_b.shape[1] - 1)
                    img_b_resampled[i, j] = img_b[src_i, src_j]
            img_b = img_b_resampled
        
        # Normalize images for better correlation
        img_a_norm = (img_a - np.mean(img_a)) / (np.std(img_a) + 1e-8)
        img_b_norm = (img_b - np.mean(img_b)) / (np.std(img_b) + 1e-8)
        
        try:
            # Calculate phase cross-correlation
            shift, error, diffphase = phase_cross_correlation(
                img_a_norm, img_b_norm, upsample_factor=10
            )
            
            print(f"Detected shift: {shift}, error: {error}")
            
            # Apply translation
            if abs(shift[0]) > 0.5 or abs(shift[1]) > 0.5:
                # Create transformation matrix
                transform = AffineTransform(translation=(-shift[1], -shift[0]))
                
                # Apply transformation to the image
                from skimage.transform import warp
                img_b_aligned = warp(img_b, transform.inverse, preserve_range=True)
                img_b_aligned = img_b_aligned.astype(img_b.dtype)
            else:
                img_b_aligned = img_b
                
        except Exception as e:
            print(f"Alignment failed: {e}, using original image")
            img_b_aligned = img_b
        
        # Write aligned image
        aligned_meta = src_a.meta.copy()
        aligned_meta.update({
            "driver": "GTiff",
            "count": 1,
            "dtype": img_b_aligned.dtype
        })
        
        with rasterio.open(output_path, "w", **aligned_meta) as dst:
            dst.write(img_b_aligned, 1)
    
    return output_path

def main():
    parser = argparse.ArgumentParser(description='Process and align GeoTIFF images')
    parser.add_argument('--image_a', required=True, help='Path to Image A')
    parser.add_argument('--image_b', required=True, help='Path to Image B')
    parser.add_argument('--aoi', required=True, help='AOI bounds as "north=lat;south=lat;east=lon;west=lon"')
    parser.add_argument('--out_dir', required=True, help='Output directory')
    
    args = parser.parse_args()
    
    print(f"Worker started with Image A: {args.image_a}, Image B: {args.image_b}")
    print(f"AOI: {args.aoi}")
    print(f"Output directory: {args.out_dir}")
    
    try:
        # Parse AOI
        aoi_bounds = parse_aoi(args.aoi)
        print(f"Parsed AOI bounds: {aoi_bounds}")
        
        # Check if input files exist
        if not os.path.exists(args.image_a):
            print(f"ERROR: Image A file not found: {args.image_a}")
            sys.exit(1)
        if not os.path.exists(args.image_b):
            print(f"ERROR: Image B file not found: {args.image_b}")
            sys.exit(1)
        
        # Create output directory
        os.makedirs(args.out_dir, exist_ok=True)
        
        # Define output paths
        clipped_a_path = os.path.join(args.out_dir, "A_clipped.tif")
        clipped_b_path = os.path.join(args.out_dir, "B_clipped.tif")
        aligned_b_path = os.path.join(args.out_dir, "B_clipped_aligned.tif")
        
        # Step 1: Clip both images to AOI
        print("Clipping Image A to AOI...")
        clip_image_to_aoi(args.image_a, aoi_bounds, clipped_a_path)
        
        print("Clipping Image B to AOI...")
        clip_image_to_aoi(args.image_b, aoi_bounds, clipped_b_path)
        
        # Step 2: Align Image B to Image A
        print("Aligning Image B to Image A...")
        align_images(clipped_a_path, clipped_b_path, aligned_b_path)
        
        print("Worker finished successfully")
        
    except Exception as e:
        print(f"Worker failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
