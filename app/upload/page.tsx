"use client";

import { useState, useCallback } from "react";

interface Conflict {
  document1: string;
  document2: string;
  description: string;
  suggestion: string;
}

interface ConflictCheckResult {
  conflicts: Conflict[];
}

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<ConflictCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState<Date | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
      setResults(null); // Clear previous results on new file selection
      setError(null);
      setLastCheckTimestamp(null);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      const filesArray = Array.from(event.dataTransfer.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
      setResults(null); // Clear previous results on new file drop
      setError(null);
      setLastCheckTimestamp(null);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const runConflictCheck = async () => {
    if (selectedFiles.length === 0) {
      alert("Please upload documents first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("documents", file);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.results && result.results.conflicts) {
        setResults(result.results);
        setLastCheckTimestamp(new Date());
      } else {
        setError("Unexpected response format from Gemini.");
      }
    } catch (err: unknown) {
      let errorMessage = "An error occurred during conflict check. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("Error during conflict check:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!results) {
      alert("No conflict results to download.");
      return;
    }
    const jsonString = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conflict_report.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8">CONTRADICT AI</h1>
      <div
        className={`w-full max-w-2xl p-8 border-2 ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        } border-dashed rounded-lg text-center shadow-sm transition-all duration-200`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <p className="text-lg text-gray-700">Drag & drop your documents here, or click to select files</p>
        <input
          type="file"
          multiple
          className="hidden"
          id="file-upload"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded cursor-pointer"
        >
          Select Files
        </label>
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Uploaded Files</h2>
        <ul className="bg-white shadow-sm rounded-lg p-4">
          {selectedFiles.length === 0 ? (
            <li className="text-gray-600">No files uploaded yet.</li>
          ) : (
            selectedFiles.map((file, index) => (
              <li key={file.name + index} className="text-gray-800 py-1">{file.name}</li>
            ))
          )}
        </ul>
      </div>
      <button
        onClick={runConflictCheck}
        className="mt-8 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={selectedFiles.length === 0 || loading}
      >
        {loading ? "Checking for conflicts..." : "Run Conflict Check"}
      </button>

      

      {lastCheckTimestamp && (
        <p className="mt-2 text-sm text-gray-500">Last checked: {lastCheckTimestamp.toLocaleString()}</p>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg w-full max-w-2xl">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="mt-8 w-full max-w-2xl bg-white shadow-sm rounded-lg p-4">
          <h2 className="text-2xl font-semibold mb-4">Conflict Check Results</h2>
          {results.conflicts.length === 0 ? (
            <p className="text-green-600">No conflicts found between the uploaded documents.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document 1</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document 2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.conflicts.map((conflict, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conflict.document1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conflict.document2}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{conflict.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{conflict.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {results && results.conflicts.length > 0 && (
        <button
          onClick={handleDownloadReport}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
        >
          Download Report (JSON)
        </button>
      )}
    </div>
  );
}
