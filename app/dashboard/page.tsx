"use client";

import { useState, useEffect } from "react";

interface UsageStats {
  totalCost: number;
  totalDocsUploaded: number;
  totalReportsGenerated: number;
}

export default function DashboardPage() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsageStats() {
      try {
        const response = await fetch("/api/usage");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: UsageStats = await response.json();
        setUsageStats(data);
      } catch (err: any) {
        console.error("Error fetching usage stats:", err);
        setError(err.message || "Failed to fetch usage statistics.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsageStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading usage statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-8">Usage Dashboard</h1>
      <div id="dashboard-version" className="text-sm mb-4">Version: 1.0.0</div>
      {usageStats ? (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Your Usage</h2>
          <p className="text-lg mb-2">
            Total Cost: <span className="font-bold">${usageStats.totalCost.toFixed(2)}</span>
          </p>
          <p className="text-lg mb-2">
            Documents Uploaded:
            <span className="font-bold"> {usageStats.totalDocsUploaded}</span>
          </p>
          <p className="text-lg mb-2">
            Reports Generated:
            <span className="font-bold"> {usageStats.totalReportsGenerated}</span>
          </p>
        </div>
      ) : (
        <p className="text-lg text-gray-700">No usage data available.</p>
      )}
    </div>
  );
}
