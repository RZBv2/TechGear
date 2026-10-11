import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

import { AdminLayout } from "@/components/techgear/AdminLayout";
import { formatPrice } from "@/data/api";
import { exportCustomersToExcel } from "@/lib/exportCustomers";
import { type User, serverListCustomers } from "@/lib/serverAuth";
import { getAdminServerOrders, type ServerOrder } from "@/lib/serverOrders";
import {
  getAdminServerSellRequests,
  type ServerSellRequest,
} from "@/lib/serverSellRequests";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/adminCustomers")({
  head: () => ({ meta: [{ title: "Customers — TechGear Admin" }] }),
  component: AdminCustomers,
});

const PAGE_SIZE = 25;

function AdminCustomers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [orders, setOrders] = useState<ServerOrder[]>([]);
  const [sellRequests, setSellRequests] = useState<ServerSellRequest[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  useEffect(() => bootTechGear(), []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [customerRows, orderRows, sellRows] = await Promise.all([
          serverListCustomers(),
          getAdminServerOrders(),
          getAdminServerSellRequests(),
        ]);
        if (active) {
          setCustomers(customerRows);
          setOrders(orderRows);
          setSellRequests(sellRows);
        }
      } catch {
        if (active) {
          setCustomers([]);
          setOrders([]);
          setSellRequests([]);
        }
      }
    };
    void refresh();
    const onStorage = () => {
      void refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => setPage(1), [search]);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(needle) ||
      c.email.toLowerCase().includes(needle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <AdminLayout title="Customers">
      <div className="admin-section-head">
        <label className="form-field" style={{ maxWidth: 280 }}>
          <span>Search customers</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or email…"
          />
        </label>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => exportCustomersToExcel(customers, orders)}
          disabled={customers.length === 0}
        >
          <Download size={16} />
          Export all to Excel
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="category-card__desc">No customers match this search.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total spent</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((customer) => {
                const customerOrders = orders.filter(
                  (o) => o.customerEmail === customer.email,
                );
                const customerSellRequests = sellRequests.filter(
                  (r) => r.customerEmail === customer.email,
                );
                const spent = customerOrders.reduce(
                  (sum, o) => sum + o.total,
                  0,
                );
                const expanded = expandedEmail === customer.email;
                return (
                  <Fragment key={customer.email}>
                    <tr>
                      <td>
                        <button
                          className="icon-btn"
                          type="button"
                          aria-label={
                            expanded ? "Collapse history" : "Expand history"
                          }
                          onClick={() =>
                            setExpandedEmail(expanded ? null : customer.email)
                          }
                        >
                          {expanded ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      </td>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customerOrders.length}</td>
                      <td>{formatPrice(spent)}</td>
                    </tr>
                    {expanded ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="admin-order-detail">
                            <div className="admin-order-detail__notes">
                              <span>
                                Order history ({customerOrders.length})
                              </span>
                              {customerOrders.length === 0 ? (
                                <p>No orders placed yet.</p>
                              ) : (
                                <ul className="admin-order-detail__items">
                                  {customerOrders.map((order) => (
                                    <li key={order.id}>
                                      <span>
                                        {order.id} ·{" "}
                                        {new Date(
                                          order.submittedAt,
                                        ).toLocaleDateString()}{" "}
                                        · {order.status}
                                      </span>
                                      <span>{formatPrice(order.total)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="admin-order-detail__notes">
                              <span>
                                Sell requests ({customerSellRequests.length})
                              </span>
                              {customerSellRequests.length === 0 ? (
                                <p>No sell requests submitted yet.</p>
                              ) : (
                                <ul className="admin-order-detail__items">
                                  {customerSellRequests.map((req) => (
                                    <li key={req.id}>
                                      <span>
                                        {req.id} · {req.model} · {req.status}
                                      </span>
                                      <span>
                                        {formatPrice(req.askingPrice)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > PAGE_SIZE ? (
        <nav className="pager" aria-label="Customers pagination">
          <button
            className="btn btn--ghost"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="pager__status">
            Page {currentPage} of {totalPages} · {filtered.length} customers
          </span>
          <button
            className="btn btn--ghost"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      ) : null}
    </AdminLayout>
  );
}
