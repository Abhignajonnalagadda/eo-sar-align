import React, { useEffect, useRef } from "react";
import L from "leaflet";

export default function AOISelector({ onAOIChange }) {
  const mapRef = useRef(null);
  const rectRef = useRef(null);

  useEffect(() => {
    const map = L.map("aoi-map").setView([0, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );
    mapRef.current = map;

    map.on("click", (e) => {
      if (rectRef.current) {
        map.removeLayer(rectRef.current);
      }
      const bounds = [
        [e.latlng.lat - 1, e.latlng.lng - 1],
        [e.latlng.lat + 1, e.latlng.lng + 1],
      ];
      rectRef.current = L.rectangle(bounds, { color: "red", weight: 1 }).addTo(
        map
      );
      onAOIChange({
        north: bounds[1][0],
        south: bounds[0][0],
        east: bounds[1][1],
        west: bounds[0][1],
      });
    });

    return () => map.remove();
  }, [onAOIChange]);

  return (
    <div>
      <h3>Draw AOI</h3>
      <p>Click on the map to place an AOI rectangle.</p>
      <div id="aoi-map" style={{ height: "300px", marginBottom: "1rem" }}></div>
    </div>
  );
}
