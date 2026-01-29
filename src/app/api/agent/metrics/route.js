import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AgentMetrics from "@/models/AgentMetrics";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "hour"; // hour, day, week

    // Calculate time range based on period
    const now = new Date();
    let startTime;
    let maxPoints;

    switch (period) {
      case "day":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
        maxPoints = 144; // Every 10 minutes
        break;
      case "week":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
        maxPoints = 168; // Every hour
        break;
      case "hour":
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour
        maxPoints = 60; // Every minute
        break;
    }

    // Fetch metrics from database
    const metrics = await AgentMetrics.find({
      timestamp: { $gte: startTime },
    })
      .sort({ timestamp: 1 })
      .lean();

    // Group metrics by timestamp (approximate to reduce data points)
    const groupedMetrics = {};
    const interval = (now.getTime() - startTime.getTime()) / maxPoints;

    metrics.forEach((metric) => {
      const bucket =
        Math.floor(metric.timestamp.getTime() / interval) * interval;

      if (!groupedMetrics[bucket]) {
        groupedMetrics[bucket] = {
          timestamp: bucket,
          time: new Date(bucket).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          agents: {},
          active: 0,
          inactive: 0,
          pending: 0,
          total: 0,
        };
      }

      // Add agent data
      groupedMetrics[bucket].agents[metric.agentId.toString()] = {
        id: metric.agentId.toString(),
        name: metric.agentName,
        load: metric.load,
        cpu: metric.cpu,
        memory: metric.memory,
        loadScore: metric.loadScore,
        location: metric.location,
        country: metric.country,
        ipAddress: metric.ipAddress,
      };

      // Store agent load as dynamic key for chart
      groupedMetrics[bucket][`agent_${metric.agentId.toString()}`] =
        metric.load;
    });

    // Convert to array and sort by timestamp
    const result = Object.values(groupedMetrics).sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    // Calculate country statistics
    const countryStats = {};
    metrics.forEach((metric) => {
      const country = metric.country || "Unknown";
      if (!countryStats[country]) {
        countryStats[country] = {
          country,
          agentCount: new Set(),
          totalLoad: 0,
          dataPoints: 0,
        };
      }
      countryStats[country].agentCount.add(metric.agentId.toString());
      countryStats[country].totalLoad += metric.load || 0;
      countryStats[country].dataPoints += 1;
    });

    // Convert to array and calculate averages
    const countryData = Object.values(countryStats)
      .map((stat) => ({
        country: stat.country,
        agentCount: stat.agentCount.size,
        avgLoad: stat.dataPoints > 0 ? stat.totalLoad / stat.dataPoints : 0,
        activity: stat.dataPoints, // Total data points = activity indicator
      }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 6); // Top 6 countries

    return NextResponse.json({
      success: true,
      period,
      startTime,
      endTime: now,
      dataPoints: result.length,
      metrics: result,
      countryStats: countryData,
    });
  } catch (error) {
    console.error("Error fetching agent metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
