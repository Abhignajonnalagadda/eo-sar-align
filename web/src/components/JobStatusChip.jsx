import React from "react";

export default function JobStatusChip({ status }) {
  const color =
    {
      Pending: "orange",
      Running: "blue",
      Done: "green",
      Error: "red",
    }[status] || "gray";

  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "0.3rem 0.6rem",
        borderRadius: "0.5rem",
        marginLeft: "1rem",
      }}
    >
      {status}
    </span>
  );
}
