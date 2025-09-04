import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import { getImageUrl } from "../api";

export default function SplitMap({ images, processedImages, aoi, onAOIChange }) {
    const mapRef = useRef(null);
    const layersRef = useRef({ a: null, b: null });
    const aoiRectRef = useRef(null);
    const sideBySideRef = useRef(null);
    const isDrawingRef = useRef(false);
    const startPointRef = useRef(null);
    const tempRectRef = useRef(null);

    const setupAOIEventListeners = (map) => {
        console.log("Setting up AOI event listeners on map:", map);

        const handleMapMouseDown = (e) => {
            console.log("=== Mouse down event ===");
            console.log("Event details:", {
                metaKey: e.originalEvent.metaKey,
                ctrlKey: e.originalEvent.ctrlKey,
                coordinates: e.latlng,
                button: e.originalEvent.button
            });

            // Only start drawing if Cmd (Mac) or Ctrl (Windows/Linux) is pressed
            if (!e.originalEvent.metaKey && !e.originalEvent.ctrlKey) {
                console.log("No modifier key pressed - ignoring mouse down");
                return;
            }

            console.log("=== Starting AOI drawing with modifier key ===");
            console.log("Start coordinates:", e.latlng);

            // Prevent default map behavior (panning, zooming, etc.)
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();

            isDrawingRef.current = true;
            startPointRef.current = e.latlng;

            // Disable map dragging during drawing
            map.dragging.disable();

            // Remove existing AOI rectangle
            if (aoiRectRef.current) {
                console.log("Removing existing AOI rectangle");
                map.removeLayer(aoiRectRef.current);
                aoiRectRef.current = null;
            }

            // Create temporary rectangle
            console.log("Creating temporary rectangle");
            tempRectRef.current = L.rectangle([e.latlng, e.latlng], {
                color: "red",
                weight: 2,
                fillColor: "red",
                fillOpacity: 0.1,
                dashArray: "5, 5"
            }).addTo(map);

            console.log("Temporary rectangle created and added to map");
        };

        const handleMapMouseMove = (e) => {
            if (!isDrawingRef.current || !startPointRef.current || !tempRectRef.current) {
                if (isDrawingRef.current) {
                    console.log("Mouse move - drawing state:", {
                        isDrawing: isDrawingRef.current,
                        startPoint: !!startPointRef.current,
                        tempRect: !!tempRectRef.current
                    });
                }
                return;
            }

            // Prevent default map behavior during drawing
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();

            // Update rectangle bounds as user drags
            const bounds = [
                [Math.min(startPointRef.current.lat, e.latlng.lat), Math.min(startPointRef.current.lng, e.latlng.lng)],
                [Math.max(startPointRef.current.lat, e.latlng.lat), Math.max(startPointRef.current.lng, e.latlng.lng)]
            ];

            console.log("Updating rectangle bounds:", bounds);
            tempRectRef.current.setBounds(bounds);
        };

        const handleMapMouseUp = (e) => {
            console.log("=== Mouse up event ===");
            console.log("Drawing state:", {
                isDrawing: isDrawingRef.current,
                startPoint: !!startPointRef.current,
                tempRect: !!tempRectRef.current
            });

            if (!isDrawingRef.current || !startPointRef.current || !tempRectRef.current) {
                console.log("Not in drawing state - ignoring mouse up");
                return;
            }

            console.log("=== Completing AOI drawing ===");
            console.log("End coordinates:", e.latlng);

            // Prevent default map behavior
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();

            isDrawingRef.current = false;

            // Re-enable map dragging
            map.dragging.enable();

            // Create final rectangle
            const bounds = [
                [Math.min(startPointRef.current.lat, e.latlng.lat), Math.min(startPointRef.current.lng, e.latlng.lng)],
                [Math.max(startPointRef.current.lat, e.latlng.lat), Math.max(startPointRef.current.lng, e.latlng.lng)]
            ];

            console.log("Final AOI bounds:", bounds);

            // Remove temporary rectangle
            console.log("Removing temporary rectangle");
            map.removeLayer(tempRectRef.current);
            tempRectRef.current = null;

            // Create final AOI rectangle
            console.log("Creating final AOI rectangle");
            aoiRectRef.current = L.rectangle(bounds, {
                color: "red",
                weight: 2,
                fillColor: "red",
                fillOpacity: 0.1,
            }).addTo(map);

            const aoiData = {
                north: bounds[1][0],
                south: bounds[0][0],
                east: bounds[1][1],
                west: bounds[0][1],
            };

            console.log("Final AOI data:", aoiData);
            console.log("Calling onAOIChange with:", aoiData);
            onAOIChange(aoiData);
            console.log("AOI drawing completed successfully");
        };

        // Add basic mouse event listeners for debugging
        map.on("mousedown", (e) => {
            console.log("=== BASIC MOUSE DOWN ===", e.latlng);
            handleMapMouseDown(e);
        });

        map.on("mousemove", (e) => {
            console.log("=== BASIC MOUSE MOVE ===", e.latlng);
            handleMapMouseMove(e);
        });

        map.on("mouseup", (e) => {
            console.log("=== BASIC MOUSE UP ===", e.latlng);
            handleMapMouseUp(e);
        });

        // Add a simple click listener to test if events are working
        map.on("click", (e) => {
            console.log("=== MAP CLICKED ===", e.latlng);
        });

        // Handle mouse leave to cancel drawing
        map.on("mouseout", () => {
            console.log("=== Mouse left map area ===");
            if (isDrawingRef.current && tempRectRef.current) {
                console.log("Canceling drawing due to mouse leave");
                map.removeLayer(tempRectRef.current);
                tempRectRef.current = null;
                isDrawingRef.current = false;
                console.log("Drawing canceled");
            }
        });

        console.log("AOI event listeners setup complete");
    };

    useEffect(() => {
        const map = L.map("split-map").setView([20, 78], 4);
        mapRef.current = map;

        // Base map
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        async function loadGeoRaster(file) {
            console.log(`Loading GeoTIFF: ${file.name}`);
            const arrayBuffer = await file.arrayBuffer();
            const georaster = await parseGeoraster(arrayBuffer);

            console.log("Georaster info:", {
                width: georaster.width,
                height: georaster.height,
                pixelWidth: georaster.pixelWidth,
                pixelHeight: georaster.pixelHeight,
                noDataValue: georaster.noDataValue,
                projection: georaster.projection,
                xmin: georaster.xmin,
                xmax: georaster.xmax,
                ymin: georaster.ymin,
                ymax: georaster.ymax
            });

            return new GeoRasterLayer({
                georaster,
                opacity: 0.9,
                resolution: 256,
            });
        }

        async function loadProcessedImage(imageUrl) {
            try {
                const response = await fetch(imageUrl);
                const arrayBuffer = await response.arrayBuffer();
                const georaster = await parseGeoraster(arrayBuffer);
                return new GeoRasterLayer({
                    georaster,
                    opacity: 0.9,
                    resolution: 256,
                });
            } catch (error) {
                console.error("Failed to load processed image:", error);
                return null;
            }
        }

        async function init() {
            if (!images.a || !images.b) return;

            console.log("=== Initializing Split Map ===");
            console.log("Image A:", images.a.name);
            console.log("Image B:", images.b.name);

            // Clear existing layers
            if (layersRef.current.a) map.removeLayer(layersRef.current.a);
            if (layersRef.current.b) map.removeLayer(layersRef.current.b);
            if (sideBySideRef.current) map.removeControl(sideBySideRef.current);

            let layerA, layerB;

            if (processedImages) {
                // Load processed images
                console.log("Loading processed images");
                layerA = await loadProcessedImage(getImageUrl(processedImages.imageAUrl));
                layerB = await loadProcessedImage(getImageUrl(processedImages.imageBUrl));
            } else {
                // Load original images
                console.log("Loading original images");
                layerA = await loadGeoRaster(images.a);
                layerB = await loadGeoRaster(images.b);
            }

            console.log("Layer A created:", !!layerA);
            console.log("Layer B created:", !!layerB);

            if (!layerA || !layerB) {
                console.error("Failed to create one or both layers");
                return;
            }

            layersRef.current = { a: layerA, b: layerB };

            const bounds = layerA.getBounds();
            console.log("Layer A bounds:", bounds);

            const boundsB = layerB.getBounds();
            console.log("Layer B bounds:", boundsB);

            map.fitBounds(bounds);

            sideBySideRef.current = L.control.sideBySide(layerA, layerB).addTo(map);
            layerA.addTo(map);
            layerB.addTo(map);

            console.log("Split map initialization complete");

            // Add event listeners after map is fully initialized
            setTimeout(() => {
                console.log("Adding event listeners after map initialization");
                setupAOIEventListeners(map);
            }, 100);
        }

        init();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
            }
        };
    }, [images, processedImages]);


    // Update AOI rectangle when aoi prop changes
    useEffect(() => {
        if (!mapRef.current || !aoi) return;

        const map = mapRef.current;

        if (aoiRectRef.current) {
            map.removeLayer(aoiRectRef.current);
        }

        const bounds = [
            [aoi.south, aoi.west],
            [aoi.north, aoi.east],
        ];

        aoiRectRef.current = L.rectangle(bounds, {
            color: "red",
            weight: 2,
            fillColor: "red",
            fillOpacity: 0.1,
        }).addTo(map);
    }, [aoi]);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Split-View Map</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Draw Area of Interest (AOI)</p>
                            <p>
                                Hold <kbd className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs font-mono">Cmd</kbd> (Mac) or <kbd className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs font-mono">Ctrl</kbd> (Windows/Linux) and drag on the map to draw a rectangle for processing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative">
                <div id="split-map" className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden shadow-sm" style={{ minHeight: '384px' }}></div>
            </div>
        </div>
    );
}
