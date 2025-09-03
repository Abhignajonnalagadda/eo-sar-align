import argparse
import time
import os

parser = argparse.ArgumentParser()
parser.add_argument('--image_a', required=True)
parser.add_argument('--image_b', required=True)
parser.add_argument('--aoi', required=True)
parser.add_argument('--out_dir', required=True)
args = parser.parse_args()

print(f"Worker started with Image A: {args.image_a}, Image B: {args.image_b}")
print(f"AOI: {args.aoi}")
print(f"Output directory: {args.out_dir}")

# Simulate processing
time.sleep(2)

# Create dummy output files
os.makedirs(args.out_dir, exist_ok=True)
with open(os.path.join(args.out_dir, "A_clipped.tif"), "w") as f:
    f.write("dummy A")
with open(os.path.join(args.out_dir, "B_clipped_aligned.tif"), "w") as f:
    f.write("dummy B")

print("Worker finished successfully")
