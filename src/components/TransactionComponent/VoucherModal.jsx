import React, { useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';

export function VoucherModal({ isOpen, onClose, data, autoDownload = false }) {
  const svgRef = useRef(null);
  const hiddenSvgRef = useRef(null);
  const downloadTriggered = useRef(false); // Guard to prevent double download

  useEffect(() => {
    if (autoDownload && hiddenSvgRef.current && !downloadTriggered.current) {
      downloadTriggered.current = true;
      handleDownload()
        .then(() => {
          onClose();
        })
        .catch(err => {
          console.error('Failed to download PDF:', err);
          onClose();
        });
    }
  }, [autoDownload, onClose]);

  if (!data) return null;

  const {
    voucherNo,
    remark,
    transactionType,
    items = [],
  } = data;

  const dateToFormat = data.transactionDate || data.date;
  const formattedDate = (() => {
    const date = new Date(dateToFormat);
    return isNaN(date.getTime())
      ? 'N/A'
      : new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(date);
  })();

  const detailsConfig = {
    Consumption: [
      { label: 'Site', getValue: d => d.siteName },
      { label: 'User', getValue: d => d.userName },
    ],
    'Issue To Engineer': [
      { label: 'From Site', getValue: d => d.fromSiteName },
      { label: 'To Engineer', getValue: d => d.toUserName },
    ],
    'Issue To Site': [
      { label: 'From Site', getValue: d => d.fromSiteName },
      { label: 'To Site', getValue: d => d.toSiteName },
    ],
    Inward: [
      { label: 'From Supplier', getValue: d => d.supplierName },
      { label: 'To Site', getValue: d => d.toSiteName },
      { label: 'Invoice Number', getValue: d => d.invoiceNumber },
      { label: 'Grand Total', getValue: d => d.grandTotal },
    ],
  };

  const itemColumns = {
    default: [
      { label: 'Material Name', key: 'materialName', x: 40, textAnchor: 'start', width: 220 },
      { label: 'Unit Type', key: 'unitType', x: 270, textAnchor: 'start', width: 180 },
      { label: 'Quantity', key: 'quantity', x: 560, textAnchor: 'end', width: 60 },
    ],
    Inward: [
      { label: 'Material Name', key: 'materialName', x: 30, textAnchor: 'start', width: 120 },
      { label: 'Unit Type', key: 'unitType', x: 160, textAnchor: 'start', width: 120 },
      { label: 'Quantity', key: 'quantity', x: 300, textAnchor: 'end', width: 60 },
      { label: 'Unit Price', key: 'unitPrice', x: 370, textAnchor: 'end', width: 60 },
      { label: 'GST', key: 'gst', x: 440, textAnchor: 'end', width: 50 },
      { label: 'Taxable', key: 'taxable', x: 500, textAnchor: 'end', width: 60 },
      { label: 'Total', key: 'total', x: 570, textAnchor: 'end', width: 60 },
    ],
  };

  const baseDetails = [
    { label: 'Voucher No', value: voucherNo },
    { label: 'Transaction Date', value: formattedDate },
    { label: 'Remark', value: remark || 'N/A' },
    { label: 'Transaction Type', value: transactionType },
  ];

  const typeDetails = detailsConfig[transactionType] || [];
  const allDetails = [
    ...baseDetails,
    ...typeDetails.map(f => ({ label: f.label, value: f.getValue(data) || 'N/A' })),
  ];

  const borderTopY = 120;
  const borderHeight = 700;
  const borderBottomY = borderTopY + borderHeight;
  const detailsHeaderY = 150;
  const detailsStartY = 175;
  const detailsSpacing = 30;
  const detailsHeight = allDetails.length * detailsSpacing;
  const tableStartY = detailsStartY + detailsHeight + 20;
  const columns = transactionType === 'Inward' ? itemColumns.Inward : itemColumns.default;

  const formatNumber = v => (typeof v === 'number' ? v.toFixed(2) : v);

  const renderSvgContent = isHidden => (
    <svg
      viewBox="0 0 595 842"
      width={isHidden ? 595 : '100%'}
      height={isHidden ? 842 : 'auto'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="595" height="100" fill="#2563eb" />
      <text x="297.5" y="50" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">
        Transaction Voucher
      </text>
      <text x="297.5" y="80" textAnchor="middle" fontSize="16" fill="#bfdbfe">
        Voucher #{voucherNo}
      </text>
      <rect x="20" y={borderTopY} width="555" height={borderHeight} rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1" />
      <text 
        x="297.5" 
        y={detailsHeaderY} 
        fontSize="16" 
        fontWeight="bold" 
        fill="#111827"
        textAnchor="middle"
      >
        Transaction Details
      </text>
      <g>
        {allDetails.map((detail, i) => {
          const y = detailsStartY + i * detailsSpacing;
          return (
            <g key={detail.label}>
              <text x="40" y={y} fontSize="12" fill="#4b5563">
                {detail.label}:
              </text>
              <text x="180" y={y} fontSize="12" fontWeight="normal" fill="#1f2937">
                {detail.value}
              </text>
            </g>
          );
        })}
      </g>
      <rect x="20" y={tableStartY} width="555" height="30" fill="#f3f4f6" />
      <g fontSize={transactionType === 'Inward' ? 10 : 12} fontWeight="bold" fill="#1f2937">
        {columns.map((col, idx) => (
          <text key={idx} x={col.x} y={tableStartY + 15} textAnchor={col.textAnchor}>
            {col.label}
          </text>
        ))}
      </g>
      {items.map((item, idx) => {
        const rowY = tableStartY + 30 + idx * 30;
        if (rowY + 30 > borderBottomY - 10) return null;
        return (
          <g key={idx}>
            <rect x="20" y={rowY} width="555" height="30" fill={idx % 2 === 0 ? '#f9fafb' : 'white'} />
            {columns.map((col, c) => {
              let value;
              if (col.key === 'unitType') {
                value = `${item.unitName || ''} (${item.unitSymbol || ''})`;
              } else if (transactionType === 'Inward' && typeof item[col.key] === 'number') {
                value = formatNumber(item[col.key]);
              } else {
                value = item[col.key] || '';
              }
              return (
                <text
                  key={c}
                  x={col.x}
                  y={rowY + 15}
                  fontSize={transactionType === 'Inward' ? 10 : 12}
                  fill="#1f2937"
                  textAnchor={col.textAnchor}
                >
                  {value}
                </text>
              );
            })}
          </g>
        );
      })}
      <text x="297.5" y="800" textAnchor="middle" fontSize="10" fill="#9ca3af">
        Generated on {new Date().toLocaleDateString()}
      </text>
    </svg>
  );

  const handleDownload = async () => {
    if (typeof window !== 'undefined') await import('svg2pdf.js');
    const svgEl = hiddenSvgRef.current;
    if (!svgEl) return;
    try {
      const pdf = new jsPDF({ unit: 'pt', format: [595, 842] });
      await pdf.svg(svgEl, { x: 0, y: 0, width: 595, height: 842 });
      pdf.save(`${voucherNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };


  return (
    <>
      {!autoDownload && isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div>
                <h2 className="text-xl font-bold">Transaction Voucher</h2>
                <p className="text-blue-100 text-sm">#{voucherNo}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF
                </button>
                <button onClick={onClose} className="bg-white/10 hover:bg-white/20 transition-colors p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-5">
              <div ref={svgRef} className="bg-white rounded-lg border mx-auto overflow-hidden shadow">
                {renderSvgContent(false)}
              </div>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, height: 0, overflow: 'hidden' }}>
        <svg ref={hiddenSvgRef}>{renderSvgContent(true)}</svg>
      </div>
    </>
  );
}

export default VoucherModal;