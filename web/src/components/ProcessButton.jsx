import React from "react";

export default function ProcessButton({ disabled, onClick, status }) {
  const getButtonText = () => {
    switch (status) {
      case "Pending":
        return "Processing...";
      case "Running":
        return "Processing...";
      default:
        return "Process AOI";
    }
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: disabled ? "#ccc" : "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer"
      }}
    >
      {getButtonText()}
    </button>
  );
}
