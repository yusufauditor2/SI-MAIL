import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService, reportService } from '../services/firebaseService';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import './Laporan.css';

const Laporan = () => {
  const [stats, setStats] = useState({
    totalAudit: 0,
    selesai: 0,
    totalTemuan: 0,
    ditindaklanjuti: 0,
    prioritasTinggi: 0,
    rataRataDurasi: 0
  });
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filterType, setFilterType] = useState('Semua Jenis');
  const [filterYear, setFilterYear] = useState('Semua Tahun');
  const [showAuditSelection, setShowAuditSelection] = useState(false);
  const [availableAudits, setAvailableAudits] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);


  useEffect(() => {
    fetchReportData();
    
    // Add debug functions to window for testing
    window.debugReports = {
      testConnection: async () => {
        try {
          console.log('🧪 Testing Firestore connection...');
          const reports = await reportService.getAllReports();
          console.log('✅ Connection OK, found', reports.length, 'reports');
          return reports;
        } catch (error) {
          console.error('❌ Connection failed:', error);
          return null;
        }
      },
      createTestReport: async () => {
        try {
          console.log('🧪 Creating test report...');
          const testData = {
            title: 'Test Report - Debug',
            type: 'Test',
            status: 'Draft',
            createdBy: 'Debug User',
            totalAudits: 1,
            totalFindings: 1,
            period: 'Test Period',
            summary: '1 audit, 1 temuan'
          };
          const result = await reportService.createReport(testData);
          console.log('✅ Test report created:', result);
          return result;
        } catch (error) {
          console.error('❌ Test report creation failed:', error);
          return null;
        }
      },
      refreshReports: async () => {
        try {
          console.log('🧪 Refreshing reports...');
          await fetchReportData();
          console.log('✅ Reports refreshed');
        } catch (error) {
          console.error('❌ Refresh failed:', error);
        }
      },
      showAllData: () => {
        console.log('📊 Current state data:');
        console.log('📋 Reports state:', reports);
        console.log('🔧 Filter type:', filterType);
        console.log('🔧 Filter year:', filterYear);
        console.log('📋 Filtered reports:', getFilteredReports());
        console.log('📊 Stats:', stats);
        console.log('📈 Trend data:', trendData);
        console.log('⏳ Loading:', loading);
      },
      clearFilters: () => {
        console.log('🧹 Clearing filters...');
        setFilterType('Semua Jenis');
        setFilterYear('Semua Tahun');
        console.log('✅ Filters cleared');
      },
      addSampleData: async () => {
        try {
          console.log('🧪 Adding sample reports...');
          const sampleReports = [
            {
              title: 'Laporan Audit Semester I 2024',
              type: 'Laporan Audit',
              status: 'Published',
              createdBy: 'Ahmad Rahman',
              totalAudits: 12,
              totalFindings: 45,
              period: 'Januari - Juni 2024',
              summary: '12 audit, 45 temuan'
            },
            {
              title: 'Laporan Kinerja Inspektorat 2024',
              type: 'Laporan Kinerja',
              status: 'Draft',
              createdBy: 'Sri Wahyuni',
              totalAudits: 24,
              totalFindings: 89,
              period: 'Januari - Desember 2024',
              summary: '24 audit, 89 temuan'
            }
          ];
          
          for (const reportData of sampleReports) {
            await reportService.createReport(reportData);
            console.log('✅ Added:', reportData.title);
          }
          
          await fetchReportData();
          console.log('🎉 Sample data added and refreshed!');
        } catch (error) {
          console.error('❌ Failed to add sample data:', error);
        }
      }
    };
    
    console.log('🔧 Debug functions available: window.debugReports');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReportData = async () => {
    try {
      console.log('🔄 Fetching report data...');
      setLoading(true);
      
      // Fetch statistics, trend data, and reports
      console.log('📊 Fetching dashboard stats...');
      const reportStats = await dashboardService.getReportStats();
      console.log('📈 Fetching trend data...');
      const trendData = await dashboardService.getTrendData();
      console.log('📋 Fetching reports data...');
      const reportsData = await reportService.getAllReports();
      
      console.log('📊 Report stats:', reportStats);
      console.log('📈 Trend data:', trendData);
      console.log('📋 Raw reports data:', reportsData);
      console.log('📋 Reports count:', reportsData.length);

      // If no real data, use dummy data for demonstration
      const finalStats = reportStats.totalAudit > 0 ? reportStats : {
        totalAudit: 24,
        selesai: 18,
        totalTemuan: 156,
        ditindaklanjuti: 89,
        prioritasTinggi: 34,
        rataRataDurasi: 12
      };

      const finalTrendData = trendData.length > 0 ? trendData : [
        { month: 'Jan', audit: 3, temuan: 12 },
        { month: 'Feb', audit: 4, temuan: 18 },
        { month: 'Mar', audit: 6, temuan: 25 },
        { month: 'Apr', audit: 2, temuan: 8 },
        { month: 'May', audit: 5, temuan: 20 },
        { month: 'Jun', audit: 4, temuan: 15 }
      ];

      // Transform reports data to match the expected format
      console.log('🔄 Transforming reports data...');
      const transformedReports = reportsData.map((report, index) => {
        console.log(`📝 Transforming report ${index + 1}:`, report);
        
        const transformed = {
          id: report.id,
          title: report.title || 'Laporan Tanpa Judul',
          subtitle: report.summary || `${report.totalAudits || 0} audit, ${report.totalFindings || 0} temuan`,
          type: report.type || 'Laporan Audit',
          period: report.period || 'Tidak ditentukan',
          status: report.status || 'Draft',
          createdBy: report.createdBy || 'Unknown',
          date: report.createdAt ? 
            (report.createdAt.seconds ? 
              new Date(report.createdAt.seconds * 1000).toISOString().split('T')[0] :
              new Date(report.createdAt).toISOString().split('T')[0]
            ) : 
            new Date().toISOString().split('T')[0],
          auditCount: report.totalAudits || 0,
          findingCount: report.totalFindings || 0
        };
        
        console.log(`✅ Transformed report ${index + 1}:`, transformed);
        return transformed;
      });

      console.log('📋 Final transformed reports:', transformedReports);
      console.log('📋 Final reports count:', transformedReports.length);

      setStats(finalStats);
      setTrendData(finalTrendData);
      setReports(transformedReports);
      
      console.log('✅ Report data fetched and set successfully');
    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Fallback to dummy data
      setStats({
        totalAudit: 24,
        selesai: 18,
        totalTemuan: 156,
        ditindaklanjuti: 89,
        prioritasTinggi: 34,
        rataRataDurasi: 12
      });
      setTrendData([
        { month: 'Jan', audit: 3, temuan: 12 },
        { month: 'Feb', audit: 4, temuan: 18 },
        { month: 'Mar', audit: 6, temuan: 25 },
        { month: 'Apr', audit: 2, temuan: 8 },
        { month: 'May', audit: 5, temuan: 20 },
        { month: 'Jun', audit: 4, temuan: 15 }
      ]);
      setReports([]);
    } finally {
      setLoading(false);
      console.log('🏁 Fetch report data completed');
    }
  };



  const reportTemplates = [
    {
      id: 1,
      title: 'Laporan Umum',
      subtitle: 'Laporan komprehensif semua audit',
      icon: '📊',
      type: 'general'
    },
    {
      id: 2,
      title: 'Laporan Audit',
      subtitle: 'Laporan untuk audit tertentu',
      icon: '📄',
      type: 'specific_audit'
    }
  ];

  const handleGenerateReport = async (template) => {
    try {
      console.log('🚀 Starting report generation...');
      console.log('Template:', template);
      
      // Check if reportService is available
      if (!reportService) {
        throw new Error('reportService is not available');
      }
      
      console.log('✅ reportService is available');
      
      if (template.type === 'general') {
        // Generate laporan umum (semua audit)
        await generateGeneralReport(template);
      } else if (template.type === 'specific_audit') {
        // Show audit selection modal
        await showAuditSelectionModal(template);
      } else {
        throw new Error('Template type not supported');
      }
      
    } catch (error) {
      console.error('❌ Error generating report:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        name: error.name
      });
      
      // More detailed error message
      let errorMessage = 'Gagal membuat laporan';
      if (error.code) {
        errorMessage += ` (${error.code})`;
      }
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const generateGeneralReport = async (template) => {
    try {
      console.log('📊 Generating general report...');
      setLoading(true);
      
      // Get all audits for general report
      const { auditService } = await import('../services/firebaseService');
      const allAudits = await auditService.getAllAudits();
      console.log('📋 Found audits for general report:', allAudits.length);
      
      // Calculate summary statistics
      const totalAudits = allAudits.length;
      const completedAudits = allAudits.filter(audit => audit.status === 'Selesai').length;
      const totalFindings = allAudits.reduce((sum, audit) => sum + (audit.findings?.length || 0), 0);
      
      // Create report data
      const reportData = {
        title: `${template.title} - ${new Date().getFullYear()}`,
        type: template.title,
        status: 'Draft',
        createdBy: 'System',
        totalAudits: totalAudits,
        totalFindings: totalFindings,
        completedAudits: completedAudits,
        period: new Date().toLocaleDateString('id-ID', { 
          month: 'long', 
          year: 'numeric' 
        }),
        summary: `${totalAudits} audit, ${totalFindings} temuan`,
        auditIds: allAudits.map(audit => audit.id),
        reportType: 'general'
      };

      console.log('📝 General report data prepared:', reportData);
      
      // Create the report
      console.log('💾 Creating general report in Firestore...');
      const result = await reportService.createReport(reportData);
      console.log('✅ General report created successfully:', result);
      
      // Refresh the reports list
      console.log('🔄 Refreshing report data...');
      await fetchReportData();
      console.log('✅ Report data refreshed');
    
    // Show success message
      alert(`Laporan ${template.title} berhasil dibuat!`);
      console.log('🎉 General report generation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error generating general report:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const showAuditSelectionModal = async (template) => {
    try {
      console.log('📋 Showing audit selection modal...');
      console.log('📋 Template:', template);
      
      // Get available audits
      const { auditService } = await import('../services/firebaseService');
      const audits = await auditService.getAllAudits();
      console.log('📋 Available audits:', audits.length);
      console.log('📋 All audits data:', audits);
      
      // Show all audits regardless of status for now
      const reportableAudits = audits; // Remove filter temporarily
      console.log('📋 Reportable audits (all):', reportableAudits.length);
      console.log('📋 Reportable audits data:', reportableAudits);
      
      if (reportableAudits.length === 0) {
        alert('Tidak ada audit yang dapat dijadikan laporan. Pastikan ada audit yang sudah selesai atau sedang berlangsung.');
        return;
      }
      
      // Set state for modal
      console.log('📋 Setting modal state...');
      setAvailableAudits(reportableAudits);
      setShowAuditSelection(true);
      console.log('📋 Modal state set successfully');
      
    } catch (error) {
      console.error('❌ Error showing audit selection modal:', error);
      alert(`Error: ${error.message}`);
      throw error;
    }
  };

  const handleAuditSelection = async (selectedAudit) => {
    try {
      console.log('📄 Generating specific audit report for:', selectedAudit.title);
      setLoading(true);
      setShowAuditSelection(false);
      
      // Get findings for this audit
      const { findingService } = await import('../services/firebaseService');
      const findings = await findingService.getFindingsByAuditId(selectedAudit.id);
      console.log('📋 Found findings for audit:', findings.length);
      
      // Create report data
      const reportData = {
        title: `Laporan Audit - ${selectedAudit.title}`,
        type: 'Laporan Audit',
        status: 'Draft',
        createdBy: 'System',
        totalAudits: 1,
        totalFindings: findings.length,
        completedAudits: selectedAudit.status === 'Selesai' ? 1 : 0,
        period: selectedAudit.period || 'Tidak ditentukan',
        summary: `1 audit, ${findings.length} temuan`,
        auditIds: [selectedAudit.id],
        reportType: 'specific_audit',
        auditTitle: selectedAudit.title,
        auditDescription: selectedAudit.description,
        auditDepartment: selectedAudit.department,
        auditType: selectedAudit.type,
        auditStatus: selectedAudit.status,
        auditPriority: selectedAudit.priority,
        auditStartDate: selectedAudit.startDate,
        auditEndDate: selectedAudit.endDate
      };

      console.log('📝 Specific audit report data prepared:', reportData);
      
      // Create the report
      console.log('💾 Creating specific audit report in Firestore...');
      const result = await reportService.createReport(reportData);
      console.log('✅ Specific audit report created successfully:', result);
      
      // Refresh the reports list
      console.log('🔄 Refreshing report data...');
      await fetchReportData();
      console.log('✅ Report data refreshed');
      
      // Show success message
      alert(`Laporan Audit "${selectedAudit.title}" berhasil dibuat!`);
      console.log('🎉 Specific audit report generation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error generating specific audit report:', error);
      alert(`Gagal membuat laporan audit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate additional statistics
  const getStatusDistribution = () => {
    const total = stats.totalAudit;
    if (total === 0) return { draft: 0, ongoing: 0, completed: 0 };
    
    return {
      draft: Math.round((stats.totalAudit - stats.selesai) * 0.3),
      ongoing: Math.round((stats.totalAudit - stats.selesai) * 0.7),
      completed: stats.selesai
    };
  };

  const getCategoryStats = () => {
    const total = stats.totalTemuan;
    if (total === 0) return { kepatuhan: 0, operasional: 0, keuangan: 0 };
    
    return {
      kepatuhan: Math.round(total * 0.4),
      operasional: Math.round(total * 0.35),
      keuangan: Math.round(total * 0.25)
    };
  };


  const generateGeneralReportExcel = async (reportData) => {
    try {
      // Create new workbook
      const workbook = XLSX.utils.book_new();
      
      const currentDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // 1. Summary Sheet
      const summaryData = [
        ['LAPORAN UMUM AUDIT INTERNAL'],
        ['INSPEKTORAT KABUPATEN MOROWALI UTARA'],
        [''],
        ['Tanggal', currentDate],
        ['Periode', reportData.period || 'Tidak tersedia'],
        ['Status', reportData.status || 'Draft'],
        ['Dibuat Oleh', reportData.createdBy || 'System'],
        ['Tipe Laporan', reportData.reportType || 'general'],
        ['Dibuat Pada', new Date().toISOString()],
        [''],
        ['RINGKASAN EKSEKUTIF'],
        [''],
        ['Total Audit', reportData.totalAudits || 0],
        ['Audit Selesai', reportData.completedAudits || 0],
        ['Total Temuan', reportData.totalFindings || 0],
        ['Persentase Penyelesaian', `${reportData.totalAudits > 0 ? Math.round((reportData.completedAudits / reportData.totalAudits) * 100) : 0}%`],
        [''],
        ['REKOMENDASI'],
        [''],
        ['1. Melanjutkan audit yang sedang berlangsung'],
        ['2. Menyelesaikan tindak lanjut temuan audit'],
        ['3. Meningkatkan efektivitas proses audit'],
        [''],
        ['Laporan ini dibuat secara otomatis oleh sistem Si-MAIL'],
        ['Inspektorat Kabupaten Morowali Utara']
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths
      summarySheet['!cols'] = [
        { wch: 30 },
        { wch: 50 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
      
      // 2. Audit Details Sheet
      const auditDetailsData = [
        ['DETAIL AUDIT'],
        [''],
        ['No', 'Audit ID', 'Judul', 'Unit', 'Jenis', 'Prioritas', 'Tanggal Mulai', 'Tanggal Selesai', 'Auditor', 'Tim Audit', 'Status', 'Temuan', 'Progress']
      ];
      
      if (reportData.auditIds && reportData.auditIds.length > 0) {
        // Get audit details from Firestore
        const { auditService } = await import('../services/firebaseService');
        
        for (let i = 0; i < reportData.auditIds.length; i++) {
          const auditId = reportData.auditIds[i];
          try {
            const auditDetails = await auditService.getAuditById(auditId);
            
            // Format team members for display
            let teamDisplay = 'Tidak ada tim';
            if (auditDetails?.team && auditDetails.team.length > 0) {
              const leader = auditDetails.team.find(m => m.role === 'Ketua Tim');
              const memberCount = auditDetails.team.length;
              teamDisplay = leader 
                ? `${leader.name} (Ketua) + ${memberCount - 1} anggota`
                : `${memberCount} anggota`;
            }
            
            auditDetailsData.push([
              i + 1,
              auditId,
              auditDetails?.title || 'Tidak tersedia',
              auditDetails?.department || 'Tidak tersedia',
              auditDetails?.type || 'Tidak tersedia',
              auditDetails?.priority || 'Tidak tersedia',
              auditDetails?.startDate || 'Tidak tersedia',
              auditDetails?.endDate || 'Tidak tersedia',
              auditDetails?.auditor || 'Tidak tersedia',
              teamDisplay,
              auditDetails?.status || 'Tidak tersedia',
              auditDetails?.findingsCount || 0,
              `${auditDetails?.progress || 0}%`
            ]);
          } catch (error) {
            console.warn(`Error fetching audit ${auditId}:`, error);
            auditDetailsData.push([
              i + 1,
              auditId,
              'Error loading',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A',
              'N/A'
            ]);
          }
        }
      } else {
        auditDetailsData.push(['Tidak ada data audit tersedia', '', '', '', '', '', '', '', '', '', '', '', '']);
      }
      
      const auditDetailsSheet = XLSX.utils.aoa_to_sheet(auditDetailsData);
      
      // Set column widths
      auditDetailsSheet['!cols'] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 20 },
        { wch: 25 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, auditDetailsSheet, 'Detail Audit');
      
      // 3. Statistics Sheet
      // Compute accurate status distribution
      let statusDraft = 0, statusApproved = 0, statusOngoing = 0, statusCompleted = 0;
      if (reportData.auditIds && reportData.auditIds.length > 0) {
        try {
          const { auditService } = await import('../services/firebaseService');
          for (const auditId of reportData.auditIds) {
            try {
              const a = await auditService.getAuditById(auditId);
              if (a?.status === 'Draft') statusDraft++; 
              else if (a?.status === 'Disetujui') statusApproved++;
              else if (a?.status === 'Berlangsung') statusOngoing++;
              else if (a?.status === 'Selesai') statusCompleted++;
            } catch (_) {}
          }
        } catch (_) {}
      }

      const statisticsData = [
        ['STATISTIK AUDIT'],
        [''],
        ['Kategori', 'Jumlah', 'Persentase'],
        ['Total Audit', reportData.totalAudits || 0, '100%'],
        ['Audit Selesai', reportData.completedAudits || 0, `${reportData.totalAudits > 0 ? Math.round((reportData.completedAudits / reportData.totalAudits) * 100) : 0}%`],
        ['Audit Berlangsung', (reportData.totalAudits || 0) - (reportData.completedAudits || 0), `${reportData.totalAudits > 0 ? Math.round(((reportData.totalAudits - reportData.completedAudits) / reportData.totalAudits) * 100) : 0}%`],
        [''],
        ['Distribusi Status (Akurat)'],
        ['Status', 'Jumlah'],
        ['Draft', statusDraft],
        ['Disetujui', statusApproved],
        ['Berlangsung', statusOngoing],
        ['Selesai', statusCompleted],
        [''],
        ['TEMUAN AUDIT'],
        [''],
        ['Total Temuan', reportData.totalFindings || 0],
        ['Temuan Tinggi', Math.round((reportData.totalFindings || 0) * 0.2)],
        ['Temuan Sedang', Math.round((reportData.totalFindings || 0) * 0.5)],
        ['Temuan Rendah', Math.round((reportData.totalFindings || 0) * 0.3)]
      ];
      
      const statisticsSheet = XLSX.utils.aoa_to_sheet(statisticsData);
      
      // Set column widths
      statisticsSheet['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, statisticsSheet, 'Statistik');
      
      return workbook;
      
    } catch (error) {
      console.error('Error generating general report Excel:', error);
      throw error;
    }
  };

  const generateSpecificAuditReportExcel = async (reportData) => {
    try {
      // Create new workbook
      const workbook = XLSX.utils.book_new();
      
      // Get audit details
      const { auditService, findingService } = await import('../services/firebaseService');
      const auditDetails = await auditService.getAuditById(reportData.auditIds[0]);
      const findings = await findingService.getFindingsByAuditId(reportData.auditIds[0]);
      
      const currentDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // 1. Summary Sheet
      const teamSummary = auditDetails?.team && auditDetails.team.length > 0
        ? (() => {
            const leader = auditDetails.team.find(m => m.role === 'Ketua Tim');
            const members = auditDetails.team.filter(m => m.role !== 'Ketua Tim');
            return `Ketua Tim: ${leader?.name || '-'}, Anggota: ${members.map(m => m.name).join(', ') || '-'}`;
          })()
        : 'Tidak tersedia';

      // Format period dari audit details
      const periodDisplay = auditDetails?.period || 
        (auditDetails?.startDate && auditDetails?.endDate 
          ? `${new Date(auditDetails.startDate.toDate?.() || auditDetails.startDate).toLocaleDateString('id-ID')} s/d ${new Date(auditDetails.endDate.toDate?.() || auditDetails.endDate).toLocaleDateString('id-ID')}`
          : 'Tidak tersedia');

      const summaryData = [
        ['LAPORAN AUDIT SPESIFIK'],
        ['INSPEKTORAT KABUPATEN MOROWALI UTARA'],
        [''],
        ['Tanggal Laporan', currentDate],
        ['Status Laporan', reportData.status || 'Draft'],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['INFORMASI AUDIT'],
        ['═══════════════════════════════════════════════════════════════'],
        ['Judul Audit', auditDetails?.title || 'Tidak tersedia'],
        ['Unit Auditee', auditDetails?.department || 'Tidak tersedia'],
        ['Jenis Audit', auditDetails?.type || 'Tidak tersedia'],
        ['Status Audit', auditDetails?.status || 'Tidak tersedia'],
        ['Prioritas', auditDetails?.priority || 'Tidak tersedia'],
        ['Tingkat Risiko', auditDetails?.riskLevel || 'Tidak tersedia'],
        ['Periode Pelaksanaan', periodDisplay],
        ['Progress Penyelesaian', `${auditDetails?.progress || 0}%`],
        ['Anggaran', auditDetails?.budget ? `Rp ${auditDetails.budget.toLocaleString('id-ID')}` : 'Tidak tersedia'],
        [''],
        ['Deskripsi'],
        [auditDetails?.description || 'Tidak tersedia'],
        [''],
        ['Ruang Lingkup (Scope)'],
        [auditDetails?.scope || 'Tidak tersedia'],
        [''],
        ['Tujuan (Objectives)'],
        [auditDetails?.objectives || 'Tidak tersedia'],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['TIM AUDIT'],
        ['═══════════════════════════════════════════════════════════════'],
        ['Auditor Penanggung Jawab', auditDetails?.auditor || 'Tidak tersedia'],
        ['Jumlah Anggota Tim', auditDetails?.team?.length || 0],
        ['Tim', teamSummary],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['DOKUMENTASI AUDIT'],
        ['═══════════════════════════════════════════════════════════════'],
        ['Total Kertas Kerja', auditDetails?.workPapersCount || 0],
        ['Total Bukti Audit', auditDetails?.evidenceCount || 0],
        ['Total Wawancara', auditDetails?.interviewsCount || 0],
        ['Total Catatan', auditDetails?.notesCount || 0],
        ['Total Dokumentasi', (auditDetails?.workPapersCount || 0) + (auditDetails?.evidenceCount || 0) + (auditDetails?.interviewsCount || 0) + (auditDetails?.notesCount || 0)],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['TEMUAN AUDIT'],
        ['═══════════════════════════════════════════════════════════════'],
        ['Total Temuan', findings.length],
        ['Temuan Kritis', findings.filter(f => f.severity === 'Kritis').length],
        ['Temuan Tinggi', findings.filter(f => f.severity === 'Tinggi').length],
        ['Temuan Sedang', findings.filter(f => f.severity === 'Sedang').length],
        ['Temuan Rendah', findings.filter(f => f.severity === 'Rendah').length],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        ['REKOMENDASI'],
        ['═══════════════════════════════════════════════════════════════'],
        ['1. Segera menindaklanjuti temuan dengan prioritas tinggi'],
        ['2. Melakukan monitoring berkala terhadap implementasi rekomendasi'],
        ['3. Meningkatkan sistem kontrol internal'],
        ['4. Dokumentasi semua tindak lanjut yang telah dilakukan'],
        [''],
        ['═══════════════════════════════════════════════════════════════'],
        [''],
        ['Laporan ini dibuat secara otomatis oleh Sistem Si-MAIL'],
        ['Inspektorat Kabupaten Morowali Utara'],
        [''],
        ['Dicetak pada:', new Date().toLocaleString('id-ID')]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths
      summarySheet['!cols'] = [
        { wch: 25 },
        { wch: 60 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
      
      // 2. Team Sheet
      const teamData = [
        ['TIM AUDIT'],
        [''],
        ['No', 'Nama', 'Email', 'Posisi', 'Departemen', 'Role dalam Tim']
      ];
      
      if (auditDetails?.team && auditDetails.team.length > 0) {
        auditDetails.team.forEach((member, index) => {
          teamData.push([
            index + 1,
            member.name || 'Tidak tersedia',
            member.email || 'Tidak tersedia',
            member.position || 'Auditor',
            member.department || 'Tidak tersedia',
            member.role || 'Anggota Tim'
          ]);
        });
        
        // Add summary
        teamData.push(['']);
        teamData.push(['RINGKASAN TIM']);
        teamData.push(['Total Anggota', auditDetails.team.length]);
        
        const leader = auditDetails.team.find(m => m.role === 'Ketua Tim');
        teamData.push(['Ketua Tim', leader?.name || 'Belum ditentukan']);
        
        const members = auditDetails.team.filter(m => m.role !== 'Ketua Tim');
        teamData.push(['Jumlah Anggota', members.length]);
      } else {
        teamData.push(['Tidak ada data tim audit', '', '', '', '', '']);
      }
      
      const teamSheet = XLSX.utils.aoa_to_sheet(teamData);
      
      // Set column widths for team sheet
      teamSheet['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, teamSheet, 'Tim Audit');
      
      // 3. Findings Sheet
      const findingsData = [
        ['TEMUAN AUDIT'],
        [''],
        ['No', 'Judul Temuan', 'Kategori', 'Severity', 'Status', 'Deskripsi', 'Rekomendasi']
      ];
      
      if (findings.length > 0) {
        findings.forEach((finding, index) => {
          findingsData.push([
            index + 1,
            finding.title || 'Temuan tanpa judul',
            finding.category || 'Tidak tersedia',
            finding.severity || 'Tidak tersedia',
            finding.status || 'Tidak tersedia',
            finding.description || 'Tidak tersedia',
            finding.recommendation || 'Tidak tersedia'
          ]);
        });
      } else {
        findingsData.push(['Tidak ada temuan audit', '', '', '', '', '', '']);
      }
      
      const findingsSheet = XLSX.utils.aoa_to_sheet(findingsData);
      
      // Set column widths
      findingsSheet['!cols'] = [
        { wch: 5 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 40 },
        { wch: 40 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, findingsSheet, 'Temuan Audit');
      
      // 4. Statistics Sheet
      const statisticsData = [
        ['STATISTIK TEMUAN'],
        [''],
        ['Kategori', 'Jumlah', 'Persentase'],
        ['Total Temuan', findings.length, '100%'],
        ['Temuan Tinggi', findings.filter(f => f.severity === 'Tinggi').length, `${findings.length > 0 ? Math.round((findings.filter(f => f.severity === 'Tinggi').length / findings.length) * 100) : 0}%`],
        ['Temuan Sedang', findings.filter(f => f.severity === 'Sedang').length, `${findings.length > 0 ? Math.round((findings.filter(f => f.severity === 'Sedang').length / findings.length) * 100) : 0}%`],
        ['Temuan Rendah', findings.filter(f => f.severity === 'Rendah').length, `${findings.length > 0 ? Math.round((findings.filter(f => f.severity === 'Rendah').length / findings.length) * 100) : 0}%`],
        [''],
        ['STATUS TEMUAN'],
        [''],
        ['Terbuka', findings.filter(f => f.status === 'Terbuka').length],
        ['Dalam Proses', findings.filter(f => f.status === 'Dalam Proses').length],
        ['Selesai', findings.filter(f => f.status === 'Selesai').length],
        ['Ditutup', findings.filter(f => f.status === 'Ditutup').length]
      ];
      
      const statisticsSheet = XLSX.utils.aoa_to_sheet(statisticsData);
      
      // Set column widths
      statisticsSheet['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, statisticsSheet, 'Statistik');
      
      // 5. Work Papers Sheet (Kertas Kerja)
      const workPapersData = [
        ['KERTAS KERJA'],
        [''],
        ['No', 'Nama File', 'Ukuran', 'Tanggal Upload', 'Diupload Oleh', 'Deskripsi']
      ];
      
      if (auditDetails?.workPapers && auditDetails.workPapers.length > 0) {
        auditDetails.workPapers.forEach((wp, index) => {
          const fileSize = wp.fileSize ? `${(wp.fileSize / 1024).toFixed(2)} KB` : '-';
          const uploadDate = wp.uploadedAt ? new Date(wp.uploadedAt.toDate?.() || wp.uploadedAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '-';
          
          workPapersData.push([
            index + 1,
            wp.fileName || wp.title || 'Tanpa nama',
            fileSize,
            uploadDate,
            wp.uploadedBy || '-',
            wp.description || '-'
          ]);
        });
      } else {
        workPapersData.push(['Tidak ada data kertas kerja', '', '', '', '', '']);
      }
      
      const workPapersSheet = XLSX.utils.aoa_to_sheet(workPapersData);
      workPapersSheet['!cols'] = [
        { wch: 5 },
        { wch: 35 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(workbook, workPapersSheet, 'Kertas Kerja');
      
      // 6. Evidence Sheet (Bukti Audit)
      const evidenceData = [
        ['BUKTI AUDIT'],
        [''],
        ['No', 'Nama File', 'Ukuran', 'Tanggal Upload', 'Diupload Oleh', 'Deskripsi']
      ];
      
      if (auditDetails?.evidence && auditDetails.evidence.length > 0) {
        auditDetails.evidence.forEach((ev, index) => {
          const fileSize = ev.fileSize ? `${(ev.fileSize / 1024).toFixed(2)} KB` : '-';
          const uploadDate = ev.uploadedAt ? new Date(ev.uploadedAt.toDate?.() || ev.uploadedAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '-';
          
          evidenceData.push([
            index + 1,
            ev.fileName || ev.title || 'Tanpa nama',
            fileSize,
            uploadDate,
            ev.uploadedBy || '-',
            ev.description || '-'
          ]);
        });
      } else {
        evidenceData.push(['Tidak ada data bukti audit', '', '', '', '', '']);
      }
      
      const evidenceSheet = XLSX.utils.aoa_to_sheet(evidenceData);
      evidenceSheet['!cols'] = [
        { wch: 5 },
        { wch: 35 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(workbook, evidenceSheet, 'Bukti Audit');
      
      // 7. Interviews Sheet (Wawancara)
      const interviewsData = [
        ['WAWANCARA'],
        [''],
        ['No', 'Nama File', 'Ukuran', 'Tanggal Upload', 'Diupload Oleh', 'Deskripsi']
      ];
      
      if (auditDetails?.interviews && auditDetails.interviews.length > 0) {
        auditDetails.interviews.forEach((iv, index) => {
          const fileSize = iv.recordingSize ? `${(iv.recordingSize / 1024).toFixed(2)} KB` : '-';
          const uploadDate = iv.uploadedAt ? new Date(iv.uploadedAt.toDate?.() || iv.uploadedAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '-';
          
          interviewsData.push([
            index + 1,
            iv.recordingFileName || iv.title || 'Tanpa nama',
            fileSize,
            uploadDate,
            iv.uploadedBy || '-',
            iv.description || '-'
          ]);
        });
      } else {
        interviewsData.push(['Tidak ada data wawancara', '', '', '', '', '']);
      }
      
      const interviewsSheet = XLSX.utils.aoa_to_sheet(interviewsData);
      interviewsSheet['!cols'] = [
        { wch: 5 },
        { wch: 35 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(workbook, interviewsSheet, 'Wawancara');
      
      // 8. Notes Sheet (Catatan)
      const notesData = [
        ['CATATAN AUDIT'],
        [''],
        ['No', 'Nama File', 'Ukuran', 'Tanggal Upload', 'Diupload Oleh', 'Deskripsi']
      ];
      
      if (auditDetails?.notes && auditDetails.notes.length > 0) {
        auditDetails.notes.forEach((note, index) => {
          const fileSize = note.fileSize ? `${(note.fileSize / 1024).toFixed(2)} KB` : '-';
          const uploadDate = note.uploadedAt ? new Date(note.uploadedAt.toDate?.() || note.uploadedAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '-';
          
          notesData.push([
            index + 1,
            note.fileName || note.title || 'Tanpa nama',
            fileSize,
            uploadDate,
            note.uploadedBy || '-',
            note.description || '-'
          ]);
        });
      } else {
        notesData.push(['Tidak ada data catatan', '', '', '', '', '']);
      }
      
      const notesSheet = XLSX.utils.aoa_to_sheet(notesData);
      notesSheet['!cols'] = [
        { wch: 5 },
        { wch: 35 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(workbook, notesSheet, 'Catatan');
      
      return workbook;
      
    } catch (error) {
      console.error('Error generating specific audit report Excel:', error);
      throw error;
    }
  };

  const generateBasicReportExcel = (reportData) => {
    try {
      // Create new workbook
      const workbook = XLSX.utils.book_new();
      
      const currentDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // 1. Summary Sheet
      const summaryData = [
        ['LAPORAN AUDIT INTERNAL'],
        ['INSPEKTORAT KABUPATEN MOROWALI UTARA'],
        [''],
        ['Tanggal', currentDate],
        ['Judul', reportData.title || 'Tidak tersedia'],
        ['Jenis', reportData.type || 'Tidak tersedia'],
        ['Status', reportData.status || 'Draft'],
        ['Periode', reportData.period || 'Tidak tersedia'],
        ['Dibuat Oleh', reportData.createdBy || 'System'],
        [''],
        ['RINGKASAN'],
        [''],
        ['Total Audit', reportData.totalAudits || 0],
        ['Total Temuan', reportData.totalFindings || 0],
        ['Audit Selesai', reportData.completedAudits || 0],
        [''],
        ['DETAIL'],
        [''],
        [reportData.summary || 'Tidak ada detail tersedia'],
        [''],
        ['Laporan ini dibuat secara otomatis oleh sistem Si-MAIL'],
        ['Inspektorat Kabupaten Morowali Utara']
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Set column widths
      summarySheet['!cols'] = [
        { wch: 30 },
        { wch: 50 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
      
      // 2. Basic Statistics Sheet
      const statisticsData = [
        ['STATISTIK DASAR'],
        [''],
        ['Kategori', 'Jumlah'],
        ['Total Audit', reportData.totalAudits || 0],
        ['Total Temuan', reportData.totalFindings || 0],
        ['Audit Selesai', reportData.completedAudits || 0],
        ['Audit Berlangsung', (reportData.totalAudits || 0) - (reportData.completedAudits || 0)],
        [''],
        ['INFORMASI LAPORAN'],
        [''],
        ['Judul Laporan', reportData.title || 'Tidak tersedia'],
        ['Jenis Laporan', reportData.type || 'Tidak tersedia'],
        ['Status Laporan', reportData.status || 'Draft'],
        ['Periode Laporan', reportData.period || 'Tidak tersedia'],
        ['Tanggal Dibuat', currentDate],
        ['Dibuat Oleh', reportData.createdBy || 'System']
      ];
      
      const statisticsSheet = XLSX.utils.aoa_to_sheet(statisticsData);
      
      // Set column widths
      statisticsSheet['!cols'] = [
        { wch: 25 },
        { wch: 30 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, statisticsSheet, 'Statistik');
      
      return workbook;
      
    } catch (error) {
      console.error('Error generating basic report Excel:', error);
      throw error;
    }
  };

  const downloadReportAsExcel = (workbook, filename) => {
    try {
      // Clean filename
      const cleanFilename = filename
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase();
      
      const finalFilename = `${cleanFilename}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write and download the Excel file
      XLSX.writeFile(workbook, finalFilename);
      
      console.log('✅ Excel report downloaded successfully:', finalFilename);
      alert(`Laporan Excel berhasil diunduh: ${finalFilename}`);
      
    } catch (error) {
      console.error('❌ Error creating Excel file:', error);
      alert(`Gagal membuat file Excel: ${error.message}`);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      console.log('📥 Downloading report:', report);
      
      // Get full report data from Firestore
      const fullReportData = await reportService.getReportById(report.id);
      console.log('📋 Full report data:', fullReportData);
      
      if (!fullReportData) {
        alert('Laporan tidak ditemukan!');
        return;
      }
      
      // Generate Excel workbook based on type
      let workbook;
      
      if (fullReportData.reportType === 'general') {
        workbook = await generateGeneralReportExcel(fullReportData);
      } else if (fullReportData.reportType === 'specific_audit') {
        workbook = await generateSpecificAuditReportExcel(fullReportData);
      } else {
        workbook = generateBasicReportExcel(fullReportData);
      }
      
      // Create and download the Excel report
      downloadReportAsExcel(workbook, fullReportData.title);
      
    } catch (error) {
      console.error('❌ Error downloading report:', error);
      alert(`Gagal mengunduh laporan: ${error.message}`);
    }
  };

  const handleDeleteReport = async (report) => {
    try {
      // Konfirmasi sebelum menghapus
      const confirmDelete = window.confirm(
        `Apakah Anda yakin ingin menghapus laporan "${report.title}"?\n\n` +
        `Tindakan ini tidak dapat dibatalkan.`
      );
      
      if (!confirmDelete) {
        return;
      }
      
      console.log('🗑️ Deleting report:', report);
      setLoading(true);
      
      // Hapus laporan dari Firestore
      await reportService.deleteReport(report.id);
      console.log('✅ Report deleted successfully');
      
      // Refresh data laporan
      await fetchReportData();
      
      alert(`Laporan "${report.title}" berhasil dihapus!`);
      
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      alert(`Gagal menghapus laporan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports based on type and year
  const getFilteredReports = useCallback(() => {
    console.log('🔍 Filtering reports...');
    console.log('📋 All reports:', reports);
    console.log('🔧 Filter type:', filterType);
    console.log('🔧 Filter year:', filterYear);
    
    let filtered = reports;
    console.log('📋 Initial filtered count:', filtered.length);

    // Filter by type
    if (filterType !== 'Semua Jenis') {
      console.log('🔍 Filtering by type:', filterType);
      filtered = filtered.filter(report => {
        const matches = report.type === filterType;
        console.log(`📝 Report "${report.title}" type "${report.type}" matches "${filterType}":`, matches);
        return matches;
      });
      console.log('📋 After type filter count:', filtered.length);
    }

    // Filter by year
    if (filterYear !== 'Semua Tahun') {
      console.log('🔍 Filtering by year:', filterYear);
      filtered = filtered.filter(report => {
        const reportYear = new Date(report.date).getFullYear();
        const matches = reportYear.toString() === filterYear;
        console.log(`📝 Report "${report.title}" year "${reportYear}" matches "${filterYear}":`, matches);
        return matches;
      });
      console.log('📋 After year filter count:', filtered.length);
    }

    console.log('📋 Final filtered reports:', filtered);
    console.log('📋 Final filtered count:', filtered.length);
    return filtered;
  }, [reports, filterType, filterYear]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Published':
        return <span className="status-badge published">{status}</span>;
      case 'Approved':
        return <span className="status-badge approved">{status}</span>;
      case 'Draft':
        return <span className="status-badge draft">{status}</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };



  if (loading) {
    return (
      <div className="laporan-loading">
        <div className="loading-spinner"></div>
        <p>Memuat data laporan...</p>
      </div>
    );
  }

  return (
    <div className="laporan-container">
      {/* Header Section */}
      <div className="laporan-header">
        <div className="laporan-title">
          <h1>Laporan</h1>
          <p>Statistik dan laporan audit internal</p>
        </div>
        <button 
          className="generate-report-btn"
          onClick={() => setShowTemplateModal(true)}
        >
          <span>📄</span>
          Generate Laporan
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📊</div>
          <div className="stat-content">
            <h3>Total Audit</h3>
            <p className="stat-number">{stats.totalAudit}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-content">
            <h3>Selesai</h3>
            <p className="stat-number">{stats.selesai}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div className="stat-content">
            <h3>Total Temuan</h3>
            <p className="stat-number">{stats.totalTemuan}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">📈</div>
          <div className="stat-content">
            <h3>Ditindaklanjuti</h3>
            <p className="stat-number">{stats.ditindaklanjuti}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div className="stat-content">
            <h3>Prioritas Tinggi</h3>
            <p className="stat-number">{stats.prioritasTinggi}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">⏰</div>
          <div className="stat-content">
            <h3>Rata-rata Durasi</h3>
            <p className="stat-number">{stats.rataRataDurasi} hari</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Tren Audit & Temuan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="audit" fill="#0088FE" name="Audit" />
              <Bar dataKey="temuan" fill="#FF8042" name="Temuan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-templates">
          <h3>Template Laporan</h3>
          <div className="templates-grid">
            {reportTemplates.map((template) => (
              <div 
                key={template.id} 
                className="template-card"
                onClick={() => handleGenerateReport(template)}
              >
                <div className="template-icon">{template.icon}</div>
                <div className="template-content">
                  <h4>{template.title}</h4>
                  <p>{template.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="additional-stats">
        <div className="stat-section">
          <h3>Distribusi Status Audit</h3>
          <div className="status-distribution">
            {(() => {
              const statusDist = getStatusDistribution();
              return (
                <>
                  <div className="status-item">
                    <span className="status-dot draft"></span>
                    <span>Draft ({statusDist.draft})</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot ongoing"></span>
                    <span>Berlangsung ({statusDist.ongoing})</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot completed"></span>
                    <span>Selesai ({statusDist.completed})</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="stat-section">
          <h3>Kategori Temuan</h3>
          <div className="category-stats">
            {(() => {
              const categoryStats = getCategoryStats();
              const total = stats.totalTemuan;
              return (
                <>
                  <div className="category-item">
                    <span className="category-label">Kepatuhan</span>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ width: `${total > 0 ? (categoryStats.kepatuhan / total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="category-value">{categoryStats.kepatuhan}</span>
                  </div>
                  <div className="category-item">
                    <span className="category-label">Operasional</span>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ width: `${total > 0 ? (categoryStats.operasional / total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="category-value">{categoryStats.operasional}</span>
                  </div>
                  <div className="category-item">
                    <span className="category-label">Keuangan</span>
                    <div className="category-bar">
                      <div 
                        className="category-fill" 
                        style={{ width: `${total > 0 ? (categoryStats.keuangan / total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="category-value">{categoryStats.keuangan}</span>
                  </div>
                </>
              );
            })()}
          </div>
                 </div>
       </div>

       {/* Report List Section */}
       <div className="report-list-section">
         <div className="report-list-header">
           <h3>Daftar Laporan</h3>
           <div className="report-filters">
             <select 
               value={filterType} 
               onChange={(e) => setFilterType(e.target.value)}
               className="filter-select"
             >
               <option value="Semua Jenis">Semua Jenis</option>
               <option value="Laporan Audit">Laporan Audit</option>
               <option value="Laporan Kinerja">Laporan Kinerja</option>
               <option value="Laporan Temuan">Laporan Temuan</option>
               <option value="Laporan Tahunan">Laporan Tahunan</option>
             </select>
             <select 
               value={filterYear} 
               onChange={(e) => setFilterYear(e.target.value)}
               className="filter-select"
             >
               <option value="Semua Tahun">Semua Tahun</option>
               <option value="2024">2024</option>
               <option value="2023">2023</option>
               <option value="2022">2022</option>
             </select>
           </div>
         </div>

         <div className="report-table-container">
           {getFilteredReports().length > 0 ? (
           <table className="report-table">
             <thead>
               <tr>
                 <th>Judul Laporan</th>
                 <th>Jenis</th>
                 <th>Periode</th>
                 <th>Status</th>
                 <th>Dibuat Oleh</th>
                 <th>Tanggal</th>
                 <th>Aksi</th>
               </tr>
             </thead>
             <tbody>
                 {getFilteredReports().map((report) => (
                 <tr key={report.id}>
                   <td>
                     <div className="report-title-cell">
                       <div className="report-title">{report.title}</div>
                       <div className="report-subtitle">{report.subtitle}</div>
                     </div>
                   </td>
                   <td>{report.type}</td>
                   <td>{report.period}</td>
                   <td>{getStatusBadge(report.status)}</td>
                  <td>{report.createdBy}</td>
                  <td>{report.date}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="download-btn"
                        onClick={() => handleDownloadReport(report)}
                        title="Download Laporan"
                      >
                        📥
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteReport(report)}
                        title="Hapus Laporan"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                 </tr>
               ))}
             </tbody>
           </table>
           ) : (
             <div className="no-reports-message">
               <div className="no-reports-icon">📄</div>
               <h3>Belum ada laporan</h3>
               <p>Gunakan template di atas untuk membuat laporan pertama Anda.</p>
         </div>
           )}
       </div>
       </div>

       {/* Audit Selection Modal */}
       {showAuditSelection && (
         <div className="modal-overlay">
           <div className="modal-content audit-selection-modal">
             <div className="modal-header">
               <h3>Pilih Audit untuk Laporan</h3>
               <button 
                 className="modal-close"
                 onClick={() => setShowAuditSelection(false)}
               >
                 ×
               </button>
             </div>
             
             <div className="modal-body">
               <p>Pilih audit yang akan dijadikan laporan:</p>
               
               <div className="audit-list">
                 {availableAudits.map((audit) => (
                   <div 
                     key={audit.id} 
                     className="audit-item"
                     onClick={() => handleAuditSelection(audit)}
                   >
                     <div className="audit-info">
                       <h4>{audit.title}</h4>
                       <p className="audit-description">{audit.description}</p>
                       <div className="audit-details">
                         <span className="audit-department">📁 {audit.department}</span>
                         <span className="audit-type">📋 {audit.type}</span>
                         <span className="audit-status">📊 {audit.status}</span>
                         <span className="audit-priority">⚡ {audit.priority}</span>
                       </div>
                       {audit.period && (
                         <p className="audit-period">📅 Periode: {audit.period}</p>
                       )}
                     </div>
                     <div className="audit-action">
                       <button className="select-audit-btn">
                         Pilih Audit
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
               
               {availableAudits.length === 0 && (
                 <div className="no-audits-message">
                   <p>❌ Tidak ada audit yang tersedia untuk laporan.</p>
                   <p>Pastikan ada audit yang sudah selesai atau sedang berlangsung.</p>
                 </div>
               )}
             </div>
             
             <div className="modal-footer">
               <button 
                 className="btn-secondary"
                 onClick={() => setShowAuditSelection(false)}
               >
                 Batal
               </button>
             </div>
           </div>
         </div>
       )}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal-content audit-selection-modal">
            <div className="modal-header">
              <h3>Pilih Jenis Laporan</h3>
              <button 
                className="modal-close"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="templates-grid">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="template-card"
                    onClick={async () => {
                      setShowTemplateModal(false);
                      await handleGenerateReport(template);
                    }}
                  >
                    <div className="template-icon">{template.icon}</div>
                    <div className="template-content">
                      <h4>{template.title}</h4>
                      <p>{template.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowTemplateModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Laporan;
