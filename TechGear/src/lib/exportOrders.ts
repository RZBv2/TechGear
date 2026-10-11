import * as XLSX from "xlsx";

import type { Order, OrderStatus } from "@/lib/orders";

/** Exports every order to a real .xlsx workbook the admin can open in Excel,
 * Google Sheets, or LibreOffice — one row per order with the full detail
 * a store manager would need (customer, items, payment, status, address). */
export function exportOrdersToExcel(
  orders: Array<Order & { customerEmail: string }>,
  deriveStatus: (order: Order) => OrderStatus,
) {
  const rows = orders.map((order) => ({
    "Order ID": order.id,
    Date: new Date(order.submittedAt).toLocaleString(),
    "Customer Email": order.customerEmail,
    Items: order.items.map((i) => `${i.name} x${i.qty}`).join("; "),
    "Item Count": order.items.reduce((sum, i) => sum + i.qty, 0),
    "Subtotal (BDT)": order.subtotal,
    "Discount (BDT)": order.discount,
    "Coupon Code": order.couponCode ?? "",
    "Total (BDT)": order.total,
    "Payment Method": order.paymentMethod.toUpperCase(),
    Status: deriveStatus(order),
    Phone: order.phone,
    "Delivery Address": order.address,
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 14 }, // Order ID
    { wch: 20 }, // Date
    { wch: 26 }, // Customer Email
    { wch: 40 }, // Items
    { wch: 10 }, // Item Count
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Discount
    { wch: 12 }, // Coupon
    { wch: 12 }, // Total
    { wch: 14 }, // Payment
    { wch: 12 }, // Status
    { wch: 14 }, // Phone
    { wch: 40 }, // Address
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Orders");

  const filename = `techgear-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
