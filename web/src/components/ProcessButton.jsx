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
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
        }`}
    >
      {getButtonText()}
    </button>
  );
}
