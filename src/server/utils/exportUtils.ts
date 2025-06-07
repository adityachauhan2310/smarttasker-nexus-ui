import { Parser } from 'json2csv';
import * as fs from 'fs';
import * as path from 'path';
import { IAnalyticsData, IMetricData, ITimeSeriesPoint } from '../models/AnalyticsData';
import PDFDocument from 'pdfkit';

/**
 * Export analytics data to CSV format
 * @param data Analytics data to export
 * @param filename Base filename without extension
 * @returns CSV string
 */
export async function exportToCsv(data: IAnalyticsData, filename: string): Promise<string> {
  // Extract metrics
  const metrics = data.metrics.map(metric => ({
    name: metric.name,
    value: metric.value,
    unit: metric.unit || '',
  }));

  // Convert timeseries data if available
  let timeSeriesData: any[] = [];
  if (data.timeSeries && data.timeSeries.length > 0) {
    data.timeSeries.forEach(series => {
      if (series.points && series.points.length > 0) {
        series.points.forEach(point => {
          timeSeriesData.push({
            series: series.name,
            timestamp: point.timestamp.toISOString(),
            value: point.value,
            label: point.label || '',
          });
        });
      }
    });
  }

  // Create CSV for metrics
  let csvContent = '';
  if (metrics.length > 0) {
    const metricsParser = new Parser({
      fields: ['name', 'value', 'unit'],
    });
    csvContent += metricsParser.parse(metrics);
  }

  // Add time series data if available
  if (timeSeriesData.length > 0) {
    const timeSeriesParser = new Parser({
      fields: ['series', 'timestamp', 'value', 'label'],
    });
    
    if (csvContent) {
      csvContent += '\n\n--- Time Series Data ---\n';
    }
    
    csvContent += timeSeriesParser.parse(timeSeriesData);
  }

  return csvContent;
}

/**
 * Export analytics data to PDF format
 * @param data Analytics data to export
 * @param title Report title
 * @returns PDF buffer
 */
export async function exportToPdf(data: IAnalyticsData, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      // Collect data chunks
      doc.on('data', (chunk) => buffers.push(chunk));
      
      // Resolve with the complete buffer when done
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Add title
      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();

      // Add generation date
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown(2);

      // Add metrics section
      doc.fontSize(14).text('Metrics', { underline: true });
      doc.moveDown();

      // Add each metric
      data.metrics.forEach((metric: IMetricData) => {
        const unit = metric.unit ? ` (${metric.unit})` : '';
        doc.fontSize(12).text(`${metric.name}${unit}: ${metric.value}`);
      });
      
      doc.moveDown(2);

      // Add time series data if available
      if (data.timeSeries && data.timeSeries.length > 0) {
        doc.fontSize(14).text('Time Series Data', { underline: true });
        doc.moveDown();

        // Add each time series
        data.timeSeries.forEach((series) => {
          doc.fontSize(12).text(`${series.name} (${series.interval})`, { underline: true });
          doc.moveDown();

          // Create table headers
          const tableTop = doc.y;
          const itemsPerPage = 20;
          let currentPage = 1;
          let itemsOnCurrentPage = 0;

          // Create column headers
          drawTimeSeriesHeaders(doc);
          doc.moveDown();

          // Add data rows
          series.points.forEach((point: ITimeSeriesPoint, index: number) => {
            // Check if we need a new page
            itemsOnCurrentPage++;
            if (itemsOnCurrentPage > itemsPerPage) {
              doc.addPage();
              drawTimeSeriesHeaders(doc);
              doc.moveDown();
              itemsOnCurrentPage = 1;
              currentPage++;
            }

            // Format date
            const dateStr = new Date(point.timestamp).toLocaleDateString();
            
            // Draw row
            doc.text(dateStr, 100, doc.y, { width: 100, align: 'left' });
            doc.text(point.value.toString(), 250, doc.y - doc.currentLineHeight(), { width: 100, align: 'right' });
            doc.text(point.label || '', 350, doc.y - doc.currentLineHeight(), { width: 100, align: 'left' });
            doc.moveDown();
          });
          
          doc.moveDown(2);
        });
      }

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper to draw time series table headers
 */
function drawTimeSeriesHeaders(doc: PDFKit.PDFDocument): void {
  doc.fontSize(10)
    .text('Date', 100, doc.y, { width: 100, align: 'left', continued: true })
    .text('Value', 250, doc.y, { width: 100, align: 'right', continued: true })
    .text('Label', 350, doc.y, { width: 100, align: 'left' });
  
  doc.moveDown(0.5);
  doc.lineWidth(1)
    .moveTo(100, doc.y)
    .lineTo(450, doc.y)
    .stroke();
  doc.moveDown(0.5);
}

/**
 * Create an aggregated analytics report combining multiple data sources
 * @param dataSources Object containing different analytics data sources
 * @param title Report title
 * @returns PDF buffer
 */
export async function createAggregatedReport(
  dataSources: {
    user?: IAnalyticsData;
    team?: IAnalyticsData;
    tasks?: IAnalyticsData;
    system?: IAnalyticsData;
  },
  title: string
): Promise<Buffer> {
  // Implementation would create a comprehensive report combining multiple data sources
  // For brevity, I'm using a placeholder implementation
  
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      // Collect data chunks
      doc.on('data', (chunk) => buffers.push(chunk));
      
      // Resolve with the complete buffer when done
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Add title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Add generation date
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown(2);

      // Add a section for each data source
      Object.entries(dataSources).forEach(([sourceType, data]) => {
        if (data) {
          doc.fontSize(16).text(`${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} Analytics`, { underline: true });
          doc.moveDown();

          // Add metrics
          data.metrics.forEach((metric) => {
            const unit = metric.unit ? ` (${metric.unit})` : '';
            doc.fontSize(12).text(`${metric.name}${unit}: ${metric.value}`);
          });
          
          doc.moveDown(2);
        }
      });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Schedule report generation and delivery
 * @param reportConfig Report configuration
 * @returns Scheduled report ID
 */
export async function scheduleReport(reportConfig: {
  type: 'user' | 'team' | 'system' | 'tasks' | 'trends';
  recipients: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'csv';
  userId?: string;
  teamId?: string;
  includeTimeSeries?: boolean;
}): Promise<string> {
  // This would integrate with a job scheduler (e.g., node-schedule) 
  // to periodically generate and email reports
  // For brevity, returning a placeholder ID
  
  return 'scheduled_report_123';
}

export default {
  exportToCsv,
  exportToPdf,
  createAggregatedReport,
  scheduleReport,
}; 