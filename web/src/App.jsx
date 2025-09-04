import React, { useState, useEffect } from "react";
import UploadPanel from "./components/UploadPanel";
import SplitMap from "./components/SplitMap";
import ProcessButton from "./components/ProcessButton";
import JobStatusChip from "./components/JobStatusChip";
import { createJob, getJobStatus } from "./api";

export default function App() {
    const [images, setImages] = useState({ a: null, b: null });
    const [imageIds, setImageIds] = useState({ a: null, b: null });
    const [aoi, setAOI] = useState(null);
    const [status, setStatus] = useState("Idle");
    const [jobId, setJobId] = useState(null);
    const [jobData, setJobData] = useState(null);
    const [showProcessed, setShowProcessed] = useState(false);
    const [error, setError] = useState(null);

    // Debug: Log state changes
    useEffect(() => {
        console.log("=== App State Changed ===");
        console.log("images:", images);
        console.log("imageIds:", imageIds);
        console.log("aoi:", aoi);
    }, [images, imageIds, aoi]);

    // Poll job status when job is running
    useEffect(() => {
        if (!jobId || status === "Done" || status === "Error") return;

        const pollInterval = setInterval(async () => {
            try {
                const job = await getJobStatus(jobId);
                setJobData(job);
                setStatus(job.status);

                if (job.status === "Done" || job.status === "Error") {
                    clearInterval(pollInterval);
                }
            } catch (err) {
                setError(`Failed to check job status: ${err.message}`);
                clearInterval(pollInterval);
            }
        }, 2000);

        return () => clearInterval(pollInterval);
    }, [jobId, status]);

    const handleProcess = async () => {
        console.log("=== Process Button Clicked ===");
        console.log("images:", images);
        console.log("imageIds:", imageIds);
        console.log("aoi:", aoi);

        if (!images.a || !images.b || !aoi) {
            console.log("Validation failed - missing data");
            console.log("images.a:", !!images.a);
            console.log("images.b:", !!images.b);
            console.log("aoi:", !!aoi);
            setError("Please upload both images and draw AOI");
            return;
        }
        if (!imageIds.a || !imageIds.b) {
            console.log("Validation failed - missing image IDs");
            setError("Images are still uploading, please wait");
            return;
        }

        console.log("All validations passed, starting job creation");
        setError(null);
        setStatus("Pending");

        try {
            const response = await createJob(imageIds.a, imageIds.b, aoi);
            console.log("Job created successfully:", response);
            setJobId(response.jobId);
        } catch (err) {
            console.error("Job creation failed:", err);
            setError(`Failed to start processing: ${err.message}`);
            setStatus("Idle");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">EO/SAR Split-View Map</h1>
                    <p className="text-gray-600">Upload GeoTIFF images and process Area of Interest (AOI) for alignment analysis</p>
                </div>

                {/* Error Alert */}
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

                {/* Upload Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <UploadPanel setImages={setImages} setImageIds={setImageIds} />
                </div>

                {/* Map */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <SplitMap
                        images={images}
                        processedImages={showProcessed && jobData?.outputs ? jobData.outputs : null}
                        aoi={aoi}
                        onAOIChange={setAOI}
                    />
                </div>

                {/* AOI Controls */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => {
                                console.log("Setting test AOI");
                                setAOI({
                                    north: 20.5,
                                    south: 19.5,
                                    east: 79.5,
                                    west: 78.5
                                });
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                        >
                            Set Test AOI
                        </button>

                        {aoi && (
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="font-medium">AOI Selected:</span>
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                    N{aoi.north.toFixed(4)}, S{aoi.south.toFixed(4)}, E{aoi.east.toFixed(4)}, W{aoi.west.toFixed(4)}
                                </span>
                                <button
                                    onClick={() => setAOI(null)}
                                    className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-200"
                                >
                                    Reset AOI
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Processing Controls */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <ProcessButton
                            onClick={handleProcess}
                            disabled={status === "Running" || status === "Pending"}
                            status={status}
                        />
                        <JobStatusChip status={status} />

                        {status === "Done" && jobData?.outputs && (
                            <div className="flex items-center">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showProcessed}
                                        onChange={(e) => setShowProcessed(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Show processed outputs</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
