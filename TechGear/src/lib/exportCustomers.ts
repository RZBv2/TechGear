import * as XLSX from "xlsx";

import type { User } from "@/lib/serverAuth";
import type { ServerOrder } from "@/lib/serverOrders";

export function exportCustomersToExcel(
  customers: User[],
  orders: ServerOrder[],
) {
  const rows = customers.map((customer) => {
    const customerOrders = orders.filter(
      (o) => o.customerEmail === customer.email,
    );
    const spent = customerOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone ?? "",
      Joined: new Date(customer.createdAt).toLocaleDateString(),
      Orders: customerOrders.length,
      "Total Spent (BDT)": spent,
    };
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Customers");

  const filename = `techgear-customers-${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
