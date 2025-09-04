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
        <div style={{ padding: "1rem" }}>
            <h1>EO/SAR Split-View Map</h1>

            {error && (
                <div style={{
                    color: "red",
                    backgroundColor: "#ffe6e6",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    marginBottom: "1rem"
                }}>
                    {error}
                </div>
            )}

            <UploadPanel setImages={setImages} setImageIds={setImageIds} />

            <SplitMap
                images={images}
                processedImages={showProcessed && jobData?.outputs ? jobData.outputs : null}
                aoi={aoi}
                onAOIChange={setAOI}
            />

            <div style={{ marginBottom: "1rem" }}>
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
                    style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        marginRight: "0.5rem"
                    }}
                >
                    Set Test AOI
                </button>

                {aoi && (
                    <div style={{ fontSize: "0.9em", color: "#666", display: "inline-block" }}>
                        <strong>AOI Selected:</strong> N{aoi.north.toFixed(4)}, S{aoi.south.toFixed(4)}, E{aoi.east.toFixed(4)}, W{aoi.west.toFixed(4)}
                        <button
                            onClick={() => setAOI(null)}
                            style={{ marginLeft: "1rem", padding: "0.2rem 0.5rem", fontSize: "0.8em" }}
                        >
                            Reset AOI
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <ProcessButton
                    onClick={handleProcess}
                    disabled={status === "Running" || status === "Pending"}
                    status={status}
                />
                <JobStatusChip status={status} />

                {status === "Done" && jobData?.outputs && (
                    <div style={{ marginTop: "1rem" }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={showProcessed}
                                onChange={(e) => setShowProcessed(e.target.checked)}
                            />
                            Show processed outputs
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
