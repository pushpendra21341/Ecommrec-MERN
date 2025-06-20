import React, { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { format } from "date-fns";
import SideBar from "./Sidebar"; // ✅ Import Sidebar
import "./adminLogs.css"; // Optional: your custom styles
import MetaData from "../layout/MetaData";

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actionType, setActionType] = useState("All");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/admin/logs", {
        withCredentials: true,
      });
      setLogs(data.logs);
      setFilteredLogs(data.logs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const result = logs.filter((log) => {
      const logDate = new Date(log.createdAt);
      const inDateRange = (!fromDate || logDate >= from) && (!toDate || logDate <= to);
      const matchesAction = actionType === "All" || log.actionDescription.includes(actionType);
      return inDateRange && matchesAction;
    });
    setFilteredLogs(result);
    setCurrentPage(1);
  };

  const downloadCSV = () => {
    const headers = ["Date", "Action", "Product", "Admin"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.createdAt), "yyyy-MM-dd HH:mm"),
      log.actionDescription,
      log.productName || "",
      `${log.triggeredBy?.name || ""} (${log.triggeredBy?.email || ""})`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "admin_logs.csv";
    link.click();
  };

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <Fragment>
      <MetaData title="Admin Activity Logs" />
      <div className="dashboard">
        <SideBar />

        <div className="adminLogsContainer">
          <h2>Admin Logs</h2>

          <div className="filters">
            <div>
              <label>From Date:</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label>To Date:</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div>
              <label>Action:</label>
              <select value={actionType} onChange={e => setActionType(e.target.value)}>
                <option>All</option>
                <option>Created</option>
                <option>Updated</option>
                <option>Deleted</option>
                <option>Restocked</option>
                <option>Out of Stock</option>
              </select>
            </div>
            <button onClick={handleFilter}>Filter</button>
            <button onClick={downloadCSV}>Download CSV</button>
          </div>

          {loading ? (
            <p>Loading logs...</p>
          ) : (
            <>
              <table className="logTable">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Product</th>
                    <th>Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length === 0 ? (
                    <tr><td colSpan="4">No logs found</td></tr>
                  ) : (
                    currentLogs.map(log => (
                      <tr key={log._id}>
                        <td>{format(new Date(log.createdAt), "dd MMM yyyy HH:mm")}</td>
                        <td>{log.actionDescription}</td>
                        <td>{log.productName || "—"}</td>
                        <td>{log.triggeredBy?.name} ({log.triggeredBy?.email})</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={currentPage === i + 1 ? "active" : ""}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default AdminLogs;
