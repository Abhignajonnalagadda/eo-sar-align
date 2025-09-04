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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload GeoTIFF Images</h2>
        <p className="text-sm text-gray-600">Select two GeoTIFF files for comparison and alignment analysis</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image A Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Image A
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".tif,.tiff"
              onChange={(e) => handleFileChange(e, "a")}
              disabled={uploading.a}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {uploading.a && (
            <div className="flex items-center text-sm text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          )}
          {fileInfo.a && !uploading.a && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              ✓ {fileInfo.a}
            </div>
          )}
        </div>

        {/* Image B Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Image B
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".tif,.tiff"
              onChange={(e) => handleFileChange(e, "b")}
              disabled={uploading.b}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {uploading.b && (
            <div className="flex items-center text-sm text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          )}
          {fileInfo.b && !uploading.b && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              ✓ {fileInfo.b}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
