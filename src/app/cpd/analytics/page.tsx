// src/app/cpd/analytics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserEmail } from "@/hooks/useUser";
import { getCPD, CPDEntry } from "@/lib/store";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

// --- Constants ---
const GMC_DOMAINS = [
  "Knowledge, Skills & Performance",
  "Safety & Quality",
  "Communication, Partnership & Teamwork",
  "Maintaining Trust",
];

type TimeFilter = 'week' | 'month' | 'year' | 'all';

// --- Helper Functions ---

/**
 * Filters CPD entries based on the selected time filter.
 */
const filterDataByTime = (entries: CPDEntry[], filter: TimeFilter): CPDEntry[] => {
  const now = new Date();
  if (filter === 'all') return entries;

  const getStartDate = () => {
    const startDate = new Date(now);
    if (filter === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (filter === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (filter === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    return startDate;
  };

  const startDate = getStartDate();
  return entries.filter(entry => new Date(entry.timestamp) >= startDate);
};

/**
 * Processes filtered data to count tag occurrences.
 */
const processTagData = (entries: CPDEntry[]) => {
  const tagCounts: Record<string, number> = {};
  for (const entry of entries) {
    for (const tag of entry.tags || []) {
      // Exclude GMC domains from this chart
      if (!GMC_DOMAINS.includes(tag)) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) // Sort descending
    .slice(0, 10); // Take top 10
};

/**
 * Processes filtered data to count GMC domain occurrences.
 */
const processGmcData = (entries: CPDEntry[]) => {
  const gmcCounts: Record<string, number> = {
    "Knowledge, Skills & Performance": 0,
    "Safety & Quality": 0,
    "Communication, Partnership & Teamwork": 0,
    "Maintaining Trust": 0,
  };
  
  for (const entry of entries) {
    for (const tag of entry.tags || []) {
      if (GMC_DOMAINS.includes(tag)) {
        gmcCounts[tag] = (gmcCounts[tag] || 0) + 1;
      }
    }
  }
  
  // Format for RadarChart
  return Object.entries(gmcCounts).map(([name, count]) => ({
    domain: name.split(',')[0], // Shorten name for chart
    count: count,
  }));
};

/**
 * Processes filtered data for the timeline chart.
 */
const processTimelineData = (entries: CPDEntry[]) => {
  const timelineMap: Record<string, number> = {};

  // Helper to get the date key (YYYY-MM-DD)
  const toDateKey = (date: Date) => date.toISOString().split('T')[0];
  
  for (const entry of entries) {
    const dateKey = toDateKey(new Date(entry.timestamp));
    timelineMap[dateKey] = (timelineMap[dateKey] || 0) + 1;
  }
  
  return Object.entries(timelineMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending by date
};


// --- Main Analytics Component ---
function AnalyticsInner() {
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState<CPDEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // 1. Fetch all CPD data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // getCPD is optimized to only fetch timestamp and tags,
      // which is exactly what we need for these charts.
      const entries = await getCPD(); 
      setAllEntries(entries);
      setLoading(false);
    };
    fetchData();
  }, []);

  // 2. Memoize filtered data
  const filteredData = useMemo(() => {
    return filterDataByTime(allEntries, timeFilter);
  }, [allEntries, timeFilter]);

  // 3. Memoize data processing for each chart
  const tagData = useMemo(() => processTagData(filteredData), [filteredData]);
  const gmcDomainData = useMemo(() => processGmcData(filteredData), [filteredData]);
  const timelineData = useMemo(() => processTimelineData(filteredData), [filteredData]);

  if (loading) {
    return <p>Loading analytics data...</p>;
  }

  if (allEntries.length === 0) {
    return (
      <div className="card">
        <div className="card__body">
          <p>No CPD entries found. Once you add reflections and tags, your analytics will appear here.</p>
        </div>
      </div>
    );
  }
  
  // Custom Tooltip for charts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--umbil-surface)',
          border: '1px solid var(--umbil-divider)',
          padding: '8px 12px',
          borderRadius: 'var(--umbil-radius-sm)',
          boxShadow: 'var(--umbil-shadow-lg)',
        }}>
          <p style={{ fontWeight: 600, color: 'var(--umbil-text)' }}>{label}</p>
          <p style={{ color: 'var(--umbil-brand-teal)' }}>{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Time Filter Toggle */}
      <div style={{ marginBottom: 24, maxWidth: '200px' }}>
        <label className="form-label" style={{fontSize: '0.875rem'}}>Time Period</label>
        <select
          className="form-control"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
        >
          <option value="all">All Time</option>
          <option value="year">Last Year</option>
          <option value="month">Last Month</option>
          <option value="week">Last Week</option>
        </select>
      </div>

      {/* Chart 1: CPD by Tag (Horizontal Bar Chart) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__body" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: 20 }}>Top 10 CPD Tags</h3>
          {tagData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--umbil-divider)" />
                <XAxis type="number" allowDecimals={false} stroke="var(--umbil-muted)" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  stroke="var(--umbil-muted)" 
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--umbil-hover-bg)' }} />
                <Bar dataKey="count" fill="var(--umbil-brand-teal)" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No tag data for this period.</p>}
        </div>
      </div>

      {/* Chart 2: GMC Domains (Radar Chart) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__body" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: 20 }}>GMC Domain Focus</h3>
          {gmcDomainData.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={gmcDomainData}>
                <PolarGrid stroke="var(--umbil-divider)" />
                <PolarAngleAxis 
                  dataKey="domain" 
                  stroke="var(--umbil-text)" 
                  style={{ fontSize: '12px' }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar 
                  name="Domains" 
                  dataKey="count" 
                  stroke="var(--umbil-brand-teal)" 
                  fill="var(--umbil-brand-teal)" 
                  fillOpacity={0.6} 
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p>No GMC domain data for this period.</p>}
        </div>
      </div>

      {/* Chart 3: Timeline (Line Chart) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__body" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: 20 }}>CPD Activity Timeline</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--umbil-divider)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--umbil-muted)" 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(dateStr) => {
                    // Show more detail for shorter time frames
                    if (timeFilter === 'week' || timeFilter === 'month') {
                      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    }
                    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
                  }}
                />
                <YAxis allowDecimals={false} stroke="var(--umbil-muted)" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--umbil-divider)' }} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--umbil-brand-teal)" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: 'var(--umbil-brand-teal)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : <p>No timeline data for this period.</p>}
        </div>
      </div>
    </>
  );
}

// Wrapper component to check for user authentication
export default function CPDAnalyticsPage() {
  const { email, loading } = useUserEmail();

  if (loading) return null; // Wait for auth state
  
  if (!email) {
    return (
      <div className="card">
        <div className="card__body">
          Please <a href="/auth" className="link">sign in</a> to view this page.
        </div>
      </div>
    );
  }

  return <AnalyticsInner />;
}