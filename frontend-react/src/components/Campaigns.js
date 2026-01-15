import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaChartLine,
  FaEnvelope,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaPaperPlane,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await axios.get("/api/emails/campaigns");
      setCampaigns(response.data);
    } catch (error) {
      setAlert({
        type: "error",
        message: "Failed to load campaigns",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "completed":
        return {
          color: "#059669",
          backgroundColor: "#ecfdf5",
          icon: FaCheckCircle,
          text: "Completed",
        };
      case "processing":
        return {
          color: "#d97706",
          backgroundColor: "#fffbeb",
          icon: FaSpinner,
          text: "Processing",
        };
      case "failed":
        return {
          color: "#dc2626",
          backgroundColor: "#fef2f2",
          icon: FaTimesCircle,
          text: "Failed",
        };
      case "pending":
        return {
          color: "#2563eb",
          backgroundColor: "#eff6ff",
          icon: FaClock,
          text: "Pending",
        };
      default:
        return {
          color: "#6b7280",
          backgroundColor: "#f9fafb",
          icon: FaExclamationTriangle,
          text: "Unknown",
        };
    }
  };

  const styles = {
    container: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 0",
      color: "#9ca3af",
    },
    spinner: {
      width: "24px",
      height: "24px",
      border: "2px solid #374151",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      marginRight: "12px",
    },
    alert: {
      padding: "1rem 1.25rem",
      borderRadius: "8px",
      marginBottom: "1.5rem",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
    alertError: {
      backgroundColor: "#1f1315",
      border: "1px solid #dc2626",
      color: "#fca5a5",
    },
    emptyState: {
      textAlign: "center",
      padding: "4rem 2rem",
      backgroundColor: "#1a1a1a",
      borderRadius: "12px",
      border: "1px solid #2d2d2d",
    },
    emptyIcon: {
      fontSize: "4rem",
      marginBottom: "1.5rem",
    },
    emptyTitle: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#ffffff",
      marginBottom: "0.75rem",
    },
    emptyDescription: {
      color: "#9ca3af",
      fontSize: "1rem",
    },
    campaignGrid: {
      display: "grid",
      gap: "1.5rem",
    },
    campaignCard: {
      backgroundColor: "#1a1a1a",
      border: "1px solid #2d2d2d",
      borderRadius: "12px",
      padding: "1.5rem",
      boxShadow:
        "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)",
      transition: "all 0.2s ease-in-out",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1.5rem",
    },
    cardTitle: {
      flex: 1,
      marginRight: "1rem",
    },
    campaignName: {
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "#ffffff",
      marginBottom: "0.5rem",
    },
    campaignSubject: {
      color: "#9ca3af",
      fontSize: "0.875rem",
      lineHeight: "1.5",
    },
    statusBadge: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "0.5rem 0.75rem",
      borderRadius: "8px",
      fontSize: "0.75rem",
      fontWeight: "600",
      whiteSpace: "nowrap",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "1rem",
      marginBottom: "1rem",
    },
    statItem: {
      textAlign: "center",
    },
    statIcon: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      margin: "0 auto 0.5rem",
    },
    statValue: {
      fontSize: "1.25rem",
      fontWeight: "700",
      lineHeight: "1.2",
    },
    statLabel: {
      fontSize: "0.75rem",
      color: "#9ca3af",
      fontWeight: "500",
      marginTop: "0.25rem",
    },
    messagePreview: {
      marginTop: "1rem",
      padding: "1rem",
      backgroundColor: "#111827",
      borderRadius: "8px",
      border: "1px solid #374151",
    },
    messageText: {
      fontSize: "0.875rem",
      color: "#d1d5db",
      lineHeight: "1.5",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          Loading campaigns...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {alert.message && (
        <div
          style={{
            ...styles.alert,
            ...(alert.type === "error" ? styles.alertError : {}),
          }}
        >
          {alert.message}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <FaPaperPlane color="#e5e7eb" />
          </div>
          <h3 style={styles.emptyTitle}>No campaigns yet</h3>
          <p style={styles.emptyDescription}>
            Create your first email campaign to get started with professional
            email marketing!
          </p>
        </div>
      ) : (
        <div style={styles.campaignGrid}>
          {campaigns.map((campaign) => {
            const statusConfig = getStatusConfig(campaign.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={campaign._id}
                style={styles.campaignCard}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 25px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)";
                }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitle}>
                    <h3 style={styles.campaignName}>{campaign.name}</h3>
                    <p style={styles.campaignSubject}>{campaign.subject}</p>
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: statusConfig.backgroundColor,
                      color: statusConfig.color,
                    }}
                  >
                    <StatusIcon size={12} />
                    {statusConfig.text}
                  </div>
                </div>

                <div style={styles.statsGrid}>
                  <div style={styles.statItem}>
                    <div
                      style={{
                        ...styles.statIcon,
                        backgroundColor: "#eff6ff",
                      }}
                    >
                      <FaUsers size={16} color="#2563eb" />
                    </div>
                    <div style={{ ...styles.statValue, color: "#2563eb" }}>
                      {campaign.totalRecipients || 0}
                    </div>
                    <div style={styles.statLabel}>Recipients</div>
                  </div>

                  <div style={styles.statItem}>
                    <div
                      style={{
                        ...styles.statIcon,
                        backgroundColor: "#ecfdf5",
                      }}
                    >
                      <FaCheckCircle size={16} color="#059669" />
                    </div>
                    <div style={{ ...styles.statValue, color: "#059669" }}>
                      {campaign.sentCount || 0}
                    </div>
                    <div style={styles.statLabel}>Sent</div>
                  </div>

                  <div style={styles.statItem}>
                    <div
                      style={{
                        ...styles.statIcon,
                        backgroundColor: "#fef2f2",
                      }}
                    >
                      <FaTimesCircle size={16} color="#dc2626" />
                    </div>
                    <div style={{ ...styles.statValue, color: "#dc2626" }}>
                      {campaign.failedCount || 0}
                    </div>
                    <div style={styles.statLabel}>Failed</div>
                  </div>

                  <div style={styles.statItem}>
                    <div
                      style={{
                        ...styles.statIcon,
                        backgroundColor: "#f3f4f6",
                      }}
                    >
                      <FaCalendarAlt size={16} color="#6b7280" />
                    </div>
                    <div style={{ ...styles.statValue, color: "#374151" }}>
                      {new Date(campaign.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                    <div style={styles.statLabel}>Created</div>
                  </div>
                </div>

                {campaign.message && (
                  <div style={styles.messagePreview}>
                    <div style={styles.messageText}>
                      {campaign.message.substring(0, 120)}
                      {campaign.message.length > 120 && "..."}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Campaigns;
