import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";

import { AdminLayout } from "@/components/techgear/AdminLayout";
import { formatPrice } from "@/data/api";
import { exportOrdersToExcel } from "@/lib/exportOrders";
import { ORDER_STATUS_STEPS, type Order, type OrderStatus } from "@/lib/orders";
import {
  getAdminServerOrders,
  updateServerOrderStatus,
} from "@/lib/serverOrders";
import { bootTechGear } from "@/scripts/motion";

export const Route = createFileRoute("/adminOrders")({
  head: () => ({ meta: [{ title: "Orders — TechGear Admin" }] }),
  component: AdminOrders,
});

const PAGE_SIZE = 20;

function AdminOrders() {
  const [orders, setOrders] = useState<
    Array<Order & { customerEmail: string }>
  >([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => bootTechGear(), []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const serverOrders = await getAdminServerOrders();
        if (active)
          setOrders(
            serverOrders as unknown as Array<Order & { customerEmail: string }>,
          );
      } catch {
        if (active) setOrders([]);
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

  useEffect(() => setPage(1), [search, statusFilter]);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      o.id.toLowerCase().includes(needle) ||
      o.customerEmail.toLowerCase().includes(needle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <AdminLayout title="Orders">
      <div className="admin-section-head">
        <label className="form-field" style={{ maxWidth: 240 }}>
          <span>Search orders</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order ID or customer email…"
          />
        </label>
        <label className="form-field" style={{ maxWidth: 220 }}>
          <span>Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as OrderStatus | "all")
            }
          >
            <option value="all">All statuses</option>
            {[...ORDER_STATUS_STEPS, "Cancelled" as OrderStatus].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => exportOrdersToExcel(orders, (order) => order.status)}
          disabled={orders.length === 0}
        >
          <Download size={16} />
          Export all to Excel
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="category-card__desc">No orders match this filter.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => {
                const expanded = expandedId === order.id;
                return (
                  <Fragment key={order.id}>
                    <tr>
                      <td>
                        <button
                          className="icon-btn"
                          type="button"
                          aria-label={
                            expanded ? "Collapse details" : "Expand details"
                          }
                          onClick={() =>
                            setExpandedId(expanded ? null : order.id)
                          }
                        >
                          {expanded ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      </td>
                      <td>{order.id}</td>
                      <td>
                        {new Date(order.submittedAt).toLocaleDateString()}
                      </td>
                      <td>{order.customerEmail}</td>
                      <td>
                        {order.items
                          .map((i) => `${i.name} x${i.qty}`)
                          .join(", ")}
                      </td>
                      <td>{order.paymentMethod.toUpperCase()}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td>
                        <select
                          className="admin-status-select"
                          value={order.status}
                          onChange={async (event) => {
                            const nextStatus = event.target
                              .value as OrderStatus;
                            try {
                              const updated = await updateServerOrderStatus({
                                data: { id: order.id, status: nextStatus },
                              });
                              if (updated)
                                setOrders((current) =>
                                  current.map((item) =>
                                    item.id === order.id
                                      ? (updated as unknown as Order & {
                                          customerEmail: string;
                                        })
                                      : item,
                                  ),
                                );
                            } catch {
                              setOrders((current) =>
                                current.map((item) =>
                                  item.id === order.id ? order : item,
                                ),
                              );
                            }
                          }}
                          aria-label={`Update ${order.id} status`}
                        >
                          {[
                            ...ORDER_STATUS_STEPS,
                            "Cancelled" as OrderStatus,
                          ].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="admin-order-detail">
                            <div className="admin-order-detail__grid">
                              <div>
                                <span>Delivery phone</span>
                                <strong>{order.phone}</strong>
                              </div>
                              <div>
                                <span>Delivery address</span>
                                <strong>{order.address}</strong>
                              </div>
                              {order.couponCode ? (
                                <div>
                                  <span>Coupon applied</span>
                                  <strong>
                                    {order.couponCode} (-
                                    {formatPrice(order.discount)})
                                  </strong>
                                </div>
                              ) : null}
                              <div>
                                <span>Subtotal</span>
                                <strong>{formatPrice(order.subtotal)}</strong>
                              </div>
                            </div>
                            <div className="admin-order-detail__notes">
                              <span>Order items</span>
                              <ul className="admin-order-detail__items">
                                {order.items.map((item) => (
                                  <li key={item.id}>
                                    <span>
                                      {item.name} × {item.qty}
                                    </span>
                                    <span>
                                      {formatPrice(item.price * item.qty)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
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
        <nav className="pager" aria-label="Orders pagination">
          <button
            className="btn btn--ghost"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="pager__status">
            Page {currentPage} of {totalPages} · {filtered.length} orders
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
