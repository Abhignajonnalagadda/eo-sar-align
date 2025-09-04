import React from "react";

export default function JobStatusChip({ status }) {
  const getStatusStyles = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Done":
        return "bg-green-100 text-green-800 border-green-200";
      case "Error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles(status)}`}
    >
      {status === "Running" && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {status}
    </span>
  );
}
