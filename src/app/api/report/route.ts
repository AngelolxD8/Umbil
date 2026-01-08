import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Check Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Fetch User Profile & Data
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const { data: entries } = await supabase
    .from('psq_entries') // Ensure this matches your table name
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Calculate Analytics for Report
  let overallScore = 0;
  let keyStrength = '-';
  const categorySums: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  if (entries && entries.length > 0) {
    // Overall Score
    const total = entries.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
    overallScore = parseFloat((total / entries.length).toFixed(1));

    // Category Breakdown
    entries.forEach((entry) => {
      if (entry.scores) {
        Object.entries(entry.scores).forEach(([cat, val]) => {
          categorySums[cat] = (categorySums[cat] || 0) + (val as number);
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      }
    });

    // Find Key Strength
    let maxAvg = -1;
    Object.keys(categorySums).forEach((cat) => {
      const avg = categorySums[cat] / categoryCounts[cat];
      if (avg > maxAvg) {
        maxAvg = avg;
        keyStrength = cat;
      }
    });
  }

  // 4. Generate PDF
  const doc = new jsPDF();

  // -- Header --
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Umbil CPD Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 28);
  doc.text(`User: ${profile?.full_name || user.email}`, 14, 33);

  // -- Analytics Section (The missing part) --
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Analytics Overview', 14, 50);

  // Stats Grid Simulation
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  
  // Box 1: Overall Score
  doc.text('Overall Score', 14, 60);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(overallScore.toString(), 14, 68);

  // Box 2: Key Strength
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Key Strength', 60, 60);
  doc.setFontSize(16);
  doc.setTextColor(34, 197, 94); // Greenish
  doc.text(keyStrength, 60, 68);

  // Box 3: Total Entries
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Entries', 120, 60);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text((entries?.length || 0).toString(), 120, 68);

  // -- Breakdown Table --
  doc.setFontSize(14);
  doc.text('Skill Breakdown', 14, 85);

  const breakdownData = Object.keys(categorySums).map((cat) => [
    cat,
    (categorySums[cat] / categoryCounts[cat]).toFixed(1),
    categoryCounts[cat].toString()
  ]);

  autoTable(doc, {
    startY: 90,
    head: [['Category', 'Avg Score', 'Assessments']],
    body: breakdownData.length ? breakdownData : [['No data', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }, // Blue
  });

  // -- Detailed Logs Section --
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Detailed Logs', 14, finalY);

  const logsData = entries?.map((e) => [
    format(new Date(e.created_at), 'MMM d, yyyy'),
    e.overall_score?.toString() || '-',
    e.reflection ? e.reflection.substring(0, 50) + '...' : 'No reflection'
  ]) || [];

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Date', 'Score', 'Reflection']],
    body: logsData,
    theme: 'striped',
  });

  // 5. Return PDF Stream
  const pdfBuffer = doc.output('arraybuffer');

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Umbil_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
    },
  });
}