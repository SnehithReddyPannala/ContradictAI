interface UsageRecord {
  id: string;
  timestamp: Date;
  cost: number;
  userId: string; // Assuming a user ID for tracking
  num_docs_uploaded: number;
  num_reports_generated: number;
  details?: unknown; // Optional details about the usage
}

let usageHistory: UsageRecord[] = [];

const COST_PER_API_CALL = 0.01; // Example cost in USD

export function recordUsage(userId: string, numDocs: number, numReports: number, details?: unknown): UsageRecord {
  const newRecord: UsageRecord = {
    id: `usage-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    cost: COST_PER_API_CALL,
    userId,
    num_docs_uploaded: numDocs,
    num_reports_generated: numReports,
    details,
  };
  usageHistory.push(newRecord);
  console.log(`Usage recorded for user ${userId}: Cost $${newRecord.cost.toFixed(2)}, Docs: ${newRecord.num_docs_uploaded}, Reports: ${newRecord.num_reports_generated}`);
  // In a real application, this would persist to a database
  return newRecord;
}

export function getUsageHistory(userId: string): UsageRecord[] {
  return usageHistory.filter(record => record.userId === userId);
}

export function getTotalUsageCost(userId: string): number {
  return getUsageHistory(userId).reduce((total, record) => total + record.cost, 0);
}

export function getTotalDocsUploaded(userId: string): number {
  return getUsageHistory(userId).reduce((total, record) => total + record.num_docs_uploaded, 0);
}

export function getTotalReportsGenerated(userId: string): number {
  return getUsageHistory(userId).reduce((total, record) => total + record.num_reports_generated, 0);
}

export function clearUsageHistory(): void {
  usageHistory = [];
  console.log("Usage history cleared.");
}
