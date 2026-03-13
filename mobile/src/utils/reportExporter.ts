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

        if (Platform.OS === 'web') {
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'inventory_report.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Placeholder for mobile CSV sharing if needed, though PDF is usually preferred
            console.log('CSV Export not natively implemented for mobile sharing yet.');
        }
    }
};
