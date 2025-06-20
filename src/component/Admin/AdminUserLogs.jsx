import React, { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { CSVLink } from "react-csv";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AdminUserLogs.css";

import SideBar from "./Sidebar";

const AdminUserLogs = () => {
  const [logs, setLogs] = useState([]);
  const [types] = useState([
    "USER_REGISTER", "USER_LOGIN", "USER_LOGOUT",
    "UPDATE_PROFILE", "CHANGE_PASSWORD", "FORGOT_PASSWORD",
    "RESET_PASSWORD", "DELETE_USER", "SUBMIT_REVIEW",
    "PLACE_ORDER", "CANCEL_ORDER",
  ]);

  const [filters, setFilters] = useState({
    type: "",
    userId: "",
    ipAddress: "",
    startDate: null,
    endDate: null,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      const params = {
        page,
        limit,
        type: filters.type,
        userId: filters.userId,
        ip: filters.ipAddress,
      };

      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const { data } = await axios.get("/api/v1/userlog/admin", {
        params,
        withCredentials: true,
      });

      setLogs(data.logs);
      setTotalPages(data.pages);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    fetchLogs();
  };

  const handleReset = () => {
    setFilters({
      type: "",
      userId: "",
      ipAddress: "",
      startDate: null,
      endDate: null,
    });
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="admin-user-logs-layout">
      <SideBar/> {/* ✅ Sidebar included */}
      <div className="user-log-container">
        <h2>User Activity Logs</h2>

        <div className="filters">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          />

          <input
            type="text"
            placeholder="IP Address"
            value={filters.ipAddress}
            onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
          />

          <DatePicker
            selected={filters.startDate}
            onChange={(date) => setFilters({ ...filters, startDate: date })}
            placeholderText="Start Date"
          />
          <DatePicker
            selected={filters.endDate}
            onChange={(date) => setFilters({ ...filters, endDate: date })}
            placeholderText="End Date"
          />

          <button onClick={handleFilter}>Apply</button>
          <button onClick={handleReset}>Reset</button>
          <CSVLink data={logs} filename={"user_logs.csv"}>
            <button>Export CSV</button>
          </CSVLink>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>User</th>
                <th>Message</th>
                <th>IP Address</th>
                <th>User-Agent</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6">No logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.type}</td>
                    <td>{log.userId?.name || "N/A"}</td>
                    <td>{log.message}</td>
                    <td>{log.ipAddress}</td>
                    <td>{log.userAgent?.substring(0, 25)}...</td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserLogs;
