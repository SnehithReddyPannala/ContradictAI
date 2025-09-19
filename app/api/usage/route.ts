import { NextResponse } from "next/server";
import { getTotalUsageCost, getTotalDocsUploaded, getTotalReportsGenerated } from "../../../lib/usageTracking";

export async function GET(request: Request) {
  // In a real app, userId would come from authentication
  const userId = "anonymous_user"; 

  try {
    const totalCost = getTotalUsageCost(userId);
    const totalDocsUploaded = getTotalDocsUploaded(userId);
    const totalReportsGenerated = getTotalReportsGenerated(userId);

    return NextResponse.json({
      totalCost: totalCost,
      totalDocsUploaded: totalDocsUploaded,
      totalReportsGenerated: totalReportsGenerated,
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return NextResponse.json({ error: "Failed to fetch usage statistics." }, { status: 500 });
  }
}
