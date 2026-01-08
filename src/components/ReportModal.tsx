'use client';

import React, { useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import dynamic from 'next/dynamic';
import { PsqAnalytics } from '@/lib/psq-analytics';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Dynamic import for the download link to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-gray-400">Loading PDF generator...</span> }
);

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PsqAnalytics | null;
}

// --- PDF Styles & Layout ---
const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottom: '2px solid #f3f4f6', paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6b7280', marginTop: 5 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #f9fafb' },
  label: { fontSize: 10, color: '#4b5563' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#111827' },
  highlightBox: { padding: 15, backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  scoreBig: { fontSize: 32, fontWeight: 'bold', color: '#2563eb' },
  scoreLabel: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: 10 },
});

// The Actual PDF Document Component
const PsqReportDocument = ({ stats }: { stats: PsqAnalytics | null }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Procurement Readiness Report</Text>
        <Text style={styles.subtitle}>Generated via Umbil CPD • {stats?.lastUpdated || new Date().toLocaleDateString()}</Text>
      </View>

      {/* Hero Stats */}
      <View style={styles.highlightBox}>
        <View>
          <Text style={styles.scoreLabel}>OVERALL SCORE</Text>
          <Text style={styles.scoreBig}>{stats?.overallScore ?? 0}%</Text>
        </View>
        <View>
           <Text style={styles.scoreLabel}>KEY STRENGTH</Text>
           <Text style={{ ...styles.scoreBig, fontSize: 18, marginTop: 10 }}>{stats?.keyStrength ?? 'N/A'}</Text>
        </View>
      </View>

      {/* Breakdown Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Breakdown</Text>
        {stats?.breakdown.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.value}>{item.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Trend Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Trend</Text>
        {stats?.trend && stats.trend.length > 0 ? (
          stats.trend.map((t, i) => (
             <View key={i} style={styles.row}>
               <Text style={styles.label}>{t.date}</Text>
               <Text style={styles.value}>{t.score}%</Text>
             </View>
          ))
        ) : (
          <Text style={styles.label}>No historical data available.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text>Umbil CPD Tool - Confidential Personal Report</Text>
      </View>
    </Page>
  </Document>
);

export default function ReportModal({ isOpen, onClose, stats }: ReportModalProps) {
  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-gray-900">
              Export Analysis
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Download a PDF summary of your current PSQ readiness, including your overall score and category breakdown.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4 py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <div className="p-3 bg-white rounded-full shadow-sm">
                   {/* Icon placeholder */}
                   <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                </div>
                
                {stats && (
                  <PDFDownloadLink
                    document={<PsqReportDocument stats={stats} />}
                    fileName={`Umbil_PSQ_Report_${new Date().toISOString().split('T')[0]}.pdf`}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => (loading ? 'Preparing Document...' : 'Download PDF Report')}
                  </PDFDownloadLink>
                )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}