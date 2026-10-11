import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { AdminLayout } from "@/components/techgear/AdminLayout";
import { formatPrice } from "@/data/api";
import { useAuth } from "@/lib/auth";
import {
  getAdminServerSellRequests,
  updateServerSellRequestStatus,
  type ServerSellRequest,
  type ServerSellRequestStatus,
} from "@/lib/serverSellRequests";
import { bootTechGear, toast } from "@/scripts/motion";

export const Route = createFileRoute("/adminSellRequests")({
  head: () => ({ meta: [{ title: "Sell Requests — TechGear Admin" }] }),
  component: AdminSellRequestsPage,
});

const STATUS_OPTIONS: ServerSellRequestStatus[] = [
  "Pending review",
  "Reviewing",
  "Offer sent",
  "Accepted",
  "Rejected",
  "Completed",
];

const PAGE_SIZE = 20;

function AdminSellRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServerSellRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ServerSellRequestStatus | "all"
  >("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  useEffect(() => bootTechGear(), []);

  const refresh = async () => {
    try {
      setRequests(await getAdminServerSellRequests());
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    void refresh();
  }, [user?.isAdmin]);

  useEffect(() => setPage(1), [search, statusFilter]);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return (
      r.model.toLowerCase().includes(needle) ||
      r.customerEmail.toLowerCase().includes(needle) ||
      r.id.toLowerCase().includes(needle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleStatusChange = async (
    id: string,
    status: ServerSellRequestStatus,
  ) => {
    setUpdatingId(id);
    try {
      await updateServerSellRequestStatus({ data: { id, status } });
      toast(`Request ${id} marked ${status}.`);
      await refresh();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Unable to update status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout title="Sell Requests">
      <div className="admin-section-head">
        <label className="form-field" style={{ maxWidth: 280 }}>
          <span>Search requests</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Model, customer email, or ref…"
          />
        </label>
        <label className="form-field" style={{ maxWidth: 220 }}>
          <span>Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as ServerSellRequestStatus | "all",
              )
            }
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="category-card__desc">
          No sell requests match this filter.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Reference</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Asking price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((req) => {
                const expanded = expandedId === req.id;
                return (
                  <Fragment key={req.id}>
                    <tr>
                      <td>
                        <button
                          className="icon-btn"
                          type="button"
                          aria-label={
                            expanded ? "Collapse details" : "Expand details"
                          }
                          onClick={() =>
                            setExpandedId(expanded ? null : req.id)
                          }
                        >
                          {expanded ? (
                            <ChevronUp size={15} />
                          ) : (
                            <ChevronDown size={15} />
                          )}
                        </button>
                      </td>
                      <td>
                        <strong>{req.id}</strong>
                        <small>
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </small>
                      </td>
                      <td>{req.customerEmail}</td>
                      <td>
                        {req.model} <small>· {req.categoryName}</small>
                      </td>
                      <td>{formatPrice(req.askingPrice)}</td>
                      <td>
                        <select
                          value={req.status}
                          disabled={updatingId === req.id}
                          onChange={(event) =>
                            handleStatusChange(
                              req.id,
                              event.target.value as ServerSellRequestStatus,
                            )
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr key={`${req.id}-detail`}>
                        <td colSpan={6}>
                          <div className="admin-order-detail">
                            {req.photoDataUrl ? (
                              <img
                                className="admin-order-detail__photo"
                                src={req.photoDataUrl}
                                alt={req.model}
                              />
                            ) : null}
                            <div className="admin-order-detail__grid">
                              <div>
                                <span>Condition</span>
                                <strong>{req.condition}</strong>
                              </div>
                              <div>
                                <span>Phone</span>
                                <strong>{req.phone}</strong>
                              </div>
                              <div>
                                <span>Pickup address</span>
                                <strong>{req.address}</strong>
                              </div>
                              <div>
                                <span>Last updated</span>
                                <strong>
                                  {new Date(req.updatedAt).toLocaleString()}
                                </strong>
                              </div>
                            </div>
                            {req.description ? (
                              <div className="admin-order-detail__notes">
                                <span>Device description</span>
                                <p>{req.description}</p>
                              </div>
                            ) : null}
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
        <nav className="pager" aria-label="Sell requests pagination">
          <button
            className="btn btn--ghost"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="pager__status">
            Page {currentPage} of {totalPages} · {filtered.length} requests
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
