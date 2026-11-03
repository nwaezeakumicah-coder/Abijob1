
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ReceiptText,
  Search,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  ShieldCheck,
  FileText,
  Wallet,
  LoaderCircle,
} from "lucide-react";

import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

import "./history.css";

type Transaction = {
  id: string;
  provider?: string;
  provider_reference?: string;
  amount_kobo?: number;
  amount_naira?: number;
  amountKobo?: number;
  amountNaira?: number;
  currency?: string;
  billing_interval?: string;
  status: string;
  paid_at?: string | null;
  created_at?: string | null;
  subscription_id?: string | null;
};

type HistoryResponse = {
  transactions?: Transaction[];
  error?: string;
  message?: string;
};

function formatAmount(transaction: Transaction) {
  const nairaAmount =
    transaction.amountNaira ?? transaction.amount_naira;

  const koboAmount =
    transaction.amountKobo ?? transaction.amount_kobo;

  const amount =
    nairaAmount !== undefined && nairaAmount !== null
      ? Number(nairaAmount)
      : Number(koboAmount ?? 0) / 100;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: transaction.currency || "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "paid" || normalized === "successful") {
    return {
      label: "Successful",
      className: "successful",
      icon: <CheckCircle2 size={13} />,
    };
  }

  if (normalized === "pending" || normalized === "processing") {
    return {
      label: "Pending",
      className: "pending",
      icon: <Clock3 size={13} />,
    };
  }

  return {
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    className: "failed",
    icon: <XCircle size={13} />,
  };
}

function getDescription(interval: string | undefined) {
  if (interval === "yearly") return "Annual Membership";
  if (interval === "monthly") return "Monthly Membership";
  return "Abi Job Membership";
}

export default function SubscriptionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/payments/history", {
        method: "GET",
        cache: "no-store",
      });

      const data: HistoryResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to retrieve your payment history."
        );
      }

      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your transactions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return transactions;

    return transactions.filter((transaction) => {
      const reference = transaction.provider_reference || "";
      const description = getDescription(
        transaction.billing_interval
      );
      const provider = transaction.provider || "";
      const status = transaction.status || "";

      return (
        reference.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search) ||
        provider.toLowerCase().includes(search) ||
        status.toLowerCase().includes(search)
      );
    });
  }, [transactions, searchTerm]);

  const successfulTransactions = transactions.filter((transaction) =>
    ["paid", "successful"].includes(transaction.status.toLowerCase())
  );

  const pendingTransactions = transactions.filter((transaction) =>
    ["pending", "processing"].includes(transaction.status.toLowerCase())
  );

  const totalPaid = successfulTransactions.reduce(
    (total, transaction) => {
      const nairaAmount =
        transaction.amountNaira ?? transaction.amount_naira;

      const koboAmount =
        transaction.amountKobo ?? transaction.amount_kobo;

      const amount =
        nairaAmount !== undefined && nairaAmount !== null
          ? Number(nairaAmount)
          : Number(koboAmount ?? 0) / 100;

      return total + (Number.isFinite(amount) ? amount : 0);
    },
    0
  );

  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalPaid);

  return (
    <main className="subscription-history-page">
      <Header />

      <section className="history-hero">
        <div className="history-hero-content">
          <Link href="/subscription/manage" className="history-back">
            <ArrowLeft size={16} />
            Back to subscription management
          </Link>

          <span className="history-eyebrow">
            <ReceiptText size={15} />
            BILLING & TRANSACTIONS
          </span>

          <h1>
            Your payment
            <span> history.</span>
          </h1>

          <p>
            Keep track of your Abi Job membership payments,
            transaction records and billing activities.
          </p>
        </div>

        <div className="history-hero-icon">
          <Wallet size={43} />
        </div>
      </section>

      <section className="history-content">
        {/* SUMMARY CARDS */}
        <div className="history-summary-grid">
          <div className="history-summary-card">
            <div className="history-summary-icon green">
              <CreditCard size={22} />
            </div>

            <span>Total successful payments</span>
            <strong>{formattedTotal}</strong>
            <small>Based on verified payment records</small>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-icon blue">
              <CheckCircle2 size={22} />
            </div>

            <span>Successful payments</span>
            <strong>{successfulTransactions.length}</strong>
            <small>Verified transactions</small>
          </div>

          <div className="history-summary-card">
            <div className="history-summary-icon orange">
              <Clock3 size={22} />
            </div>

            <span>Pending payments</span>
            <strong>{pendingTransactions.length}</strong>
            <small>Awaiting confirmation</small>
          </div>
        </div>

        {/* TRANSACTION SECTION */}
        <div className="history-section-heading">
          <div>
            <span className="history-section-kicker">
              TRANSACTION RECORDS
            </span>

            <h2>All payments</h2>

            <p>
              Your personal payment transactions and verification
              records.
            </p>
          </div>

          <Link href="/subscription" className="history-new-payment">
            View plans
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="history-notice">
          <ShieldCheck size={19} />

          <p>
            <strong>Secure payment records:</strong> Only transactions
            associated with your authenticated Abi Job account are
            displayed here.
          </p>
        </div>

        <div className="history-table-card">
          <div className="history-table-header">
            <div>
              <h3>Transaction activity</h3>
              <p>Your Paystack payment records</p>
            </div>

            <div className="history-table-tools">
              <div className="history-search">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search transactions"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  aria-label="Search transactions"
                />
              </div>

              <button
                type="button"
                className="history-filter-btn"
                onClick={loadTransactions}
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle size={16} />
                ) : (
                  <CalendarDays size={16} />
                )}
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: "18px 22px",
                color: "#a12d20",
                background: "#fff0ed",
              }}
            >
              {error}

              <button
                type="button"
                onClick={loadTransactions}
                style={{
                  marginLeft: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Try again
              </button>
            </div>
          )}

          <div className="history-table-scroll">
            <table className="history-table">
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT METHOD</th>
                  <th>STATUS</th>
                  <th>REFERENCE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "35px" }}>
                      <LoaderCircle
                        size={22}
                        className="animate-spin"
                      />
                      <p>Loading your payment history...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "35px 20px",
                      }}
                    >
                      {searchTerm
                        ? "No transactions match your search."
                        : "You do not have any payment records yet."}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const status = getStatus(transaction.status);

                    return (
                      <tr key={transaction.id}>
                        <td>
                          <div className="history-transaction-name">
                            <strong>
                              {getDescription(
                                transaction.billing_interval
                              )}
                            </strong>

                            <span>
                              Abi Job Membership
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatDate(
                            transaction.paid_at ||
                              transaction.created_at
                          )}
                        </td>

                        <td className="history-amount">
                          {formatAmount(transaction)}
                        </td>

                        <td>
                          {transaction.provider
                            ? transaction.provider.toUpperCase()
                            : "Not available"}
                        </td>

                        <td>
                          <span
                            className={`history-status ${status.className}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <span
                            title={transaction.provider_reference || ""}
                            style={{
                              display: "inline-block",
                              maxWidth: "160px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {transaction.provider_reference ||
                              "Not available"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="history-table-footer">
            <span>
              Showing {filteredTransactions.length} of{" "}
              {transactions.length} transactions
            </span>

            <span>
              {successfulTransactions.length} successful ·{" "}
              {pendingTransactions.length} pending
            </span>
          </div>
        </div>

        {/* EMPTY ACCOUNT STATE */}
        {!loading && transactions.length === 0 && !error && (
          <div className="history-empty-card">
            <div className="history-empty-icon">
              <FileText size={27} />
            </div>

            <div>
              <h3>Your payment records will appear here</h3>

              <p>
                You have no recorded payments yet. Once you complete
                a membership payment, its transaction details and
                verification status will appear here.
              </p>

              <Link
                href="/subscription"
                className="history-new-payment"
                style={{ marginTop: "15px" }}
              >
                Explore membership plans
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {/* SUPPORT */}
        <div className="history-support">
          <div className="history-support-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h3>Have a question about a payment?</h3>

            <p>
              Contact the Abi Job support team for help with
              membership billing and transaction enquiries.
            </p>
          </div>

          <Link href="/contact">
            Contact support
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
