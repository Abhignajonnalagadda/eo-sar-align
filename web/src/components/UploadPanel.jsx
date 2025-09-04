import React, { useState } from "react";
import { uploadImage } from "../api";

export default function UploadPanel({ setImages, setImageIds }) {
  const [fileInfo, setFileInfo] = useState({ a: null, b: null });
  const [uploading, setUploading] = useState({ a: false, b: false });
  const [error, setError] = useState(null);

  const handleFileChange = async (e, key) => {
    const file = e.target.files[0];
    console.log(`=== File selected for ${key} ===`);
    console.log("File:", file);

    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().match(/\.(tif|tiff)$/)) {
      console.log("File type validation failed:", file.name);
      setError("Please select a GeoTIFF file (.tif or .tiff)");
      return;
    }

    console.log("File type validation passed, starting upload");
    setUploading(prev => ({ ...prev, [key]: true }));
    setError(null);

    try {
      console.log("Calling uploadImage API...");
      const response = await uploadImage(file);
      console.log("Upload response:", response);

      setFileInfo((prev) => ({
        ...prev,
        [key]: file.name + " (" + (file.size / 1024 / 1024).toFixed(1) + " MB)",
      }));
      setImages((prev) => {
        const newImages = { ...prev, [key]: file };
        console.log("Updated images state:", newImages);
        return newImages;
      });
      setImageIds((prev) => {
        const newImageIds = { ...prev, [key]: response.imageId };
        console.log("Updated imageIds state:", newImageIds);
        return newImageIds;
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setError(`Failed to upload ${file.name}: ${err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h2>Upload GeoTIFFs</h2>
      {error && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          {error}
        </div>
      )}
      <div>
        <label>
          Image A:
          <input
            type="file"
            accept=".tif,.tiff"
            onChange={(e) => handleFileChange(e, "a")}
            disabled={uploading.a}
          />
        </label>
        {uploading.a && <span> (Uploading...)</span>}
        {fileInfo.a && !uploading.a && <span> → {fileInfo.a}</span>}
      </div>
      <div>
        <label>
          Image B:
          <input
            type="file"
            accept=".tif,.tiff"
            onChange={(e) => handleFileChange(e, "b")}
            disabled={uploading.b}
          />
        </label>
        {uploading.b && <span> (Uploading...)</span>}
        {fileInfo.b && !uploading.b && <span> → {fileInfo.b}</span>}
      </div>
    </div>
  );
}
