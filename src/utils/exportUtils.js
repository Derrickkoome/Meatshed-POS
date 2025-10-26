import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatPrice, formatDate } from './formatters';

// ============ PDF EXPORTS ============

// Export orders to PDF
export const exportOrdersToPDF = (orders, filename = 'sales-report.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('MeatShed POS - Sales Report', 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);
  doc.text(`Total Orders: ${orders.length}`, 14, 34);
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  doc.text(`Total Revenue: ${formatPrice(totalRevenue)}`, 14, 40);
  
  // Prepare table data
  const tableData = orders.map(order => [
    order.id,
    formatDate(order.timestamp),
    order.items.length.toString(),
    order.paymentMethod,
    formatPrice(order.total)
  ]);
  
  // Check if autoTable exists
  if (doc.autoTable) {
    doc.autoTable({
      startY: 45,
      head: [['Order ID', 'Date', 'Items', 'Payment', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 9 },
    });
  }
  
  // Save PDF
  doc.save(filename);
};

// Export single order receipt to PDF
export const exportReceiptToPDF = (order, filename = `receipt-${order.id}.pdf`) => {
  const doc = new jsPDF();
  
  // Company header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('MeatShed POS', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Premium Quality Meats', 105, 27, { align: 'center' });
  doc.text('Nairobi, Kenya', 105, 32, { align: 'center' });
  doc.text('Tel: +254 700 000 000', 105, 37, { align: 'center' });
  
  // Order details
  doc.setFontSize(12);
  doc.text(`Order ID: ${order.id}`, 14, 50);
  doc.text(`Date: ${formatDate(order.timestamp)}`, 14, 57);
  doc.text(`Cashier: ${order.cashier || 'Admin'}`, 14, 64);
  doc.text(`Payment: ${order.paymentMethod}`, 14, 71);
  
  // Items table
  const itemsData = order.items.map(item => [
    item.title,
    item.quantity.toString(),
    formatPrice(item.price),
    formatPrice(item.price * item.quantity)
  ]);
  
  if (doc.autoTable) {
    doc.autoTable({
      startY: 80,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: itemsData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });
    
    // Get final Y position
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatPrice(order.subtotal)}`, 190, finalY, { align: 'right' });
    doc.text(`Tax (16%): ${formatPrice(order.tax)}`, 190, finalY + 7, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: ${formatPrice(order.total)}`, 190, finalY + 17, { align: 'right' });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your purchase!', 105, finalY + 30, { align: 'center' });
    doc.text('Visit us again soon!', 105, finalY + 35, { align: 'center' });
  }
  
  // Save PDF
  doc.save(filename);
};

// Export inventory to PDF
export const exportInventoryToPDF = (products, filename = 'inventory-report.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('MeatShed POS - Inventory Report', 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 28);
  doc.text(`Total Products: ${products.length}`, 14, 34);
  
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  doc.text(`Total Inventory Value: ${formatPrice(totalValue)}`, 14, 40);
  
  // Prepare table data
  const tableData = products.map(product => [
    product.title,
    product.category,
    formatPrice(product.price),
    product.stock.toString(),
    formatPrice(product.price * product.stock)
  ]);
  
  if (doc.autoTable) {
    doc.autoTable({
      startY: 45,
      head: [['Product', 'Category', 'Price', 'Stock', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      styles: { fontSize: 9 },
    });
  }
  
  // Save PDF
  doc.save(filename);
};

// ============ EXCEL EXPORTS ============

// Export orders to Excel
export const exportOrdersToExcel = (orders, filename = 'sales-report.xlsx') => {
  const data = orders.map(order => ({
    'Order ID': order.id,
    'Date': formatDate(order.timestamp),
    'Items Count': order.items.length,
    'Payment Method': order.paymentMethod,
    'Subtotal': order.subtotal,
    'Tax': order.tax,
    'Total': order.total,
    'Cashier': order.cashier || 'Admin'
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
  XLSX.writeFile(wb, filename);
};

// Export order details to Excel
export const exportOrderDetailsToExcel = (order, filename = `order-${order.id}.xlsx`) => {
  const orderInfo = [
    { Field: 'Order ID', Value: order.id },
    { Field: 'Date', Value: formatDate(order.timestamp) },
    { Field: 'Payment Method', Value: order.paymentMethod },
    { Field: 'Cashier', Value: order.cashier || 'Admin' },
    { Field: 'Subtotal', Value: order.subtotal },
    { Field: 'Tax', Value: order.tax },
    { Field: 'Total', Value: order.total },
  ];
  
  const items = order.items.map(item => ({
    'Product': item.title,
    'Quantity': item.quantity,
    'Price': item.price,
    'Total': item.price * item.quantity
  }));
  
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(orderInfo);
  XLSX.utils.book_append_sheet(wb, ws1, 'Order Info');
  const ws2 = XLSX.utils.json_to_sheet(items);
  XLSX.utils.book_append_sheet(wb, ws2, 'Items');
  XLSX.writeFile(wb, filename);
};

// Export inventory to Excel
export const exportInventoryToExcel = (products, filename = 'inventory-report.xlsx') => {
  const data = products.map(product => ({
    'Product Name': product.title,
    'Category': product.category,
    'Price': product.price,
    'Stock': product.stock,
    'Value': product.price * product.stock,
    'Description': product.description || ''
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, filename);
};

// Export sales summary to Excel
export const exportSalesSummaryToExcel = (orders, products, filename = 'sales-summary.xlsx') => {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  const summary = [
    { Metric: 'Total Orders', Value: orders.length },
    { Metric: 'Total Revenue', Value: totalRevenue },
    { Metric: 'Average Order Value', Value: avgOrderValue },
    { Metric: 'Total Products', Value: products.length },
  ];
  
  const categorySales = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      const category = product?.category || 'other';
      categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity);
    });
  });
  
  const categoryData = Object.entries(categorySales).map(([category, amount]) => ({
    Category: category,
    Revenue: amount
  }));
  
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
  const ws2 = XLSX.utils.json_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, ws2, 'By Category');
  XLSX.writeFile(wb, filename);
};