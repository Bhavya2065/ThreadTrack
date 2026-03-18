import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const reportExporter = {
    async exportInventoryToPDF(materials: any[], title: string) {
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                        h1 { color: #333; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Current Stock</th>
                                <th>Unit</th>
                                <th>Min Required</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materials.map(m => `
                                <tr>
                                    <td>${m.Name}</td>
                                    <td>${m.CurrentStock}</td>
                                    <td>${m.Unit}</td>
                                    <td>${m.MinimumRequired}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        if (Platform.OS === 'web') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.print();
            }
        } else {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
    },

    async exportOrdersToPDF(orders: any[], title: string) {
        const html = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                        h1 { color: #333; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .status { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Product</th>
                                <th>Buyer</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(o => `
                                <tr>
                                    <td>#${o.OrderID}</td>
                                    <td>${o.ProductName}</td>
                                    <td>${o.BuyerName}</td>
                                    <td>${o.Quantity}</td>
                                    <td class="status">${o.Status}</td>
                                    <td>${new Date(o.OrderDate).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        if (Platform.OS === 'web') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.print();
            }
        } else {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
    },

    async exportInventoryToCSV(materials: any[]) {
        const header = 'Material ID,Name,Current Stock,Unit,Min Required,Last Updated\n';
        const rows = materials.map(m =>
            `${m.MaterialID},"${m.Name}",${m.CurrentStock},${m.Unit},${m.MinimumRequired},"${new Date(m.LastUpdated).toLocaleString()}"`
        ).join('\n');

        const csvContent = header + rows;
        this.downloadCSV(csvContent, 'inventory_report.csv');
    },

    async exportOrdersToCSV(orders: any[]) {
        const header = 'Order ID,Product,Buyer,Quantity,Status,Order Date,Notes\n';
        const rows = orders.map(o =>
            `${o.OrderID},"${o.ProductName}","${o.BuyerName}",${o.Quantity},"${o.Status}","${new Date(o.OrderDate).toLocaleString()}","${(o.CompletionNotes || '').replace(/"/g, '""')}"`
        ).join('\n');

        const csvContent = header + rows;
        this.downloadCSV(csvContent, 'order_history.csv');
    },

    downloadCSV(csvContent: string, fileName: string) {
        if (Platform.OS === 'web') {
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', fileName);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // For mobile, you would typically use expo-file-system to save and then expo-sharing to share.
            // Since expo-file-system is not installed, we log the intent.
            console.log('CSV Export not natively implemented for mobile sharing without expo-file-system.');
        }
    }
};
