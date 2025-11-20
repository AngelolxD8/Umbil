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
// These must match the tags in ReflectionModal.tsx EXACTLY
const GMC_DOMAINS = [
  "Knowledge, Skills & Performance",
  "Safety & Quality",
  "Communication, Partnership & Teamwork",
  "Maintaining Trust",
];

type TimeFilter = 'week' | 'month' | 'year' | 'all';

// --- Helper Functions ---

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

const processTagData = (entries: CPDEntry[]) => {
  const tagCounts: Record<string, number> = {};
  for (const entry of entries) {
    for (const tag of entry.tags || []) {
      // STRICT EXCLUSION: Only count tags that are NOT in the GMC list
      if (!GMC_DOMAINS.includes(tag.trim())) {
        const cleanTag = tag.trim();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      }
    }
  }
  return Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count) 
    .slice(0, 10); 
};

const processGmcData = (entries: CPDEntry[]) => {
  // Initialize with 0 so the radar chart always has shape
  const gmcCounts: Record<string, number> = {
    "Knowledge, Skills & Performance": 0,
    "Safety & Quality": 0,
    "Communication, Partnership & Teamwork": 0,
    "Maintaining Trust": 0,
  };
  
  for (const entry of entries) {
    for (const tag of entry.tags || []) {
      // STRICT INCLUSION: Only count tags that ARE in the GMC list
      const cleanTag = tag.trim();
      if (GMC_DOMAINS.includes(cleanTag)) {
        gmcCounts[cleanTag] = (gmcCounts[cleanTag] || 0) + 1;
      }
    }
  }
  
  // Map to chart format, shortening names for better display
  return Object.entries(gmcCounts).map(([name, count]) => {
    let shortName = name;
    if (name.includes("Knowledge")) shortName = "Knowledge";
    if (name.includes("Safety")) shortName = "Safety";
    if (name.includes("Communication")) shortName = "Communication";
    if (name.includes("Trust")) shortName = "Trust";

    return {
      domain: shortName,
      fullDomain: name,
      count: count,
    };
  });
};

const processTimelineData = (entries: CPDEntry[], filter: TimeFilter) => {
  const timelineMap: Record<string, number> = {};
  const toDateKey = (date: Date) => date.toISOString().split('T')[0];
  
  for (const entry of entries) {
    const dateKey = toDateKey(new Date(entry.timestamp));
    timelineMap[dateKey] = (timelineMap[dateKey] || 0) + 1;
  }
  
  return Object.entries(timelineMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};


// --- Main Analytics Component ---
function AnalyticsInner() {
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState<CPDEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const entries = await getCPD(); 
      setAllEntries(entries);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return filterDataByTime(allEntries, timeFilter);
  }, [allEntries, timeFilter]);

  const tagData = useMemo(() => processTagData(filteredData), [filteredData]);
  const gmcDomainData = useMemo(() => processGmcData(filteredData), [filteredData]);
  const timelineData = useMemo(() => processTimelineData(filteredData, timeFilter), [filteredData, timeFilter]);

  if (loading) return <p>Loading analytics...</p>;

  if (allEntries.length === 0) {
    return (
      <div className="card"><div className="card__body">No CPD entries found yet.</div></div>
    );
  }
  
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
          <h3 style={{ marginBottom: 20 }}>Clinical Topics (Top 10)</h3>
          <p style={{fontSize: '0.85rem', color: 'var(--umbil-muted)', marginBottom: 16}}>
            Excludes GMC domains to focus on clinical subjects.
          </p>
          {tagData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagData} layout="vertical" margin={{ left: 10, right: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--umbil-divider)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100} 
                  stroke="var(--umbil-text)" 
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: 'var(--umbil-hover-bg)' }} content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--umbil-brand-teal)" barSize={24} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{color: 'var(--umbil-muted)', fontStyle: 'italic'}}>No clinical tags found in this period.</p>}
        </div>
      </div>

      {/* Chart 2: GMC Domains (Radar Chart) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__body" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: 20 }}>GMC Domain Coverage</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={gmcDomainData}>
                <PolarGrid stroke="var(--umbil-divider)" />
                <PolarAngleAxis 
                  dataKey="domain" 
                  stroke="var(--umbil-muted)" 
                  style={{ fontSize: '11px', fontWeight: 600 }} 
                  tickSize={10}
                />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar 
                  name="Entries" 
                  dataKey="count" 
                  stroke="var(--umbil-brand-teal)" 
                  fill="var(--umbil-brand-teal)" 
                  fillOpacity={0.5} 
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Timeline (Line Chart) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__body" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: 20 }}>Activity Timeline</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData} margin={{ right: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--umbil-divider)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--umbil-muted)" 
                  style={{ fontSize: '11px' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(dateStr) => {
                    if (timeFilter === 'week') return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' });
                    if (timeFilter === 'month') return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short' });
                  }}
                />
                <YAxis allowDecimals={false} stroke="var(--umbil-muted)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--umbil-brand-teal)" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--umbil-surface)', stroke: 'var(--umbil-brand-teal)', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{color: 'var(--umbil-muted)', fontStyle: 'italic'}}>No activity in this period.</p>}
        </div>
      </div>
    </>
  );
}

export default function CPDAnalyticsPage() {
  const { email, loading } = useUserEmail();
  if (loading) return null; 
  if (!email) return <div className="card"><div className="card__body">Please sign in to view analytics.</div></div>;
  return <AnalyticsInner />;
}