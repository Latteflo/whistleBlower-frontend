import React, { useState, useEffect, useMemo } from "react"
import "./styles/style.css"
import ReplyComponent from "./ReplyComponent"
import {
  FaInbox,
  FaFileAlt,
  FaDraft2Digital,
  FaFlag,
  FaCalendarAlt,
  FaRegCheckCircle,
  FaTags,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa"

import { useAuth } from "../AuthContext/AuthContext"
import { useNavigate } from "react-router-dom"
import NewCategoryComponent from "./NewCategoryComponent"
import GenerateReportHTML from "./GenerateReportHTML"

const AdminDashboard = () => {
  const navigate = useNavigate()

  const { token, userId } = useAuth()
  const [reports, setReports] = useState([])
  const [sortField, setSortField] = useState("date")
  const [showDetailView, setShowDetailView] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [sortOrder, setSortOrder] = useState("asc")
  const statuses = ["Open", "Closed", "Resolved"]
  const [unopenedCount, setUnopenedCount] = useState(0)
  const [priorityClicks, setPriorityClicks] = useState({})
  const priorities = ["Low", "Medium", "High", "Resolved"]
  const [statusMessage, setStatusMessage] = useState("")
  const [adminSetFlagColor, setAdminSetFlagColor] = useState("")
  const [flagColors, setFlagColors] = useState({})

  useEffect(() => {
    const fetchReports = async () => {
      const myHeaders = new Headers()
      myHeaders.append("Authorization", `Bearer ${token}`)

      try {
        const response = await fetch(
          "https://whistle-blower-server.vercel.app/reports/all",
          {
            method: "GET",
            headers: myHeaders,
          }
        )

        if (response.ok) {
          const data = await response.json()
          console.log("Received data:", data)

          if (Array.isArray(data) || Array.isArray(data.data)) {
            setReports(Array.isArray(data) ? data : data.data)
          } else if (data && data.message) {
            console.error(`Server message: ${data.message}`)
          } else {
            console.error("Data fetched is not an array:", data)
          }
        } else {
          console.error(`HTTP Error: ${response.status}`)
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error)
      }
    }

    fetchReports()
  }, [token])

  const handleReportClick = (report, index) => {
    setSelectedReport(report)
    setCurrentIndex(index)
    setShowDetailView(true)
    markAsRead(report.id)
  }
  const markAsRead = async (reportId) => {
    handleStatusChange(reportId, "Opened")
  }

  const navigateReport = (direction) => {
    let newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1
    if (newIndex >= 0 && newIndex < sortedReports.length) {
      setCurrentIndex(newIndex)
      setSelectedReport(sortedReports[newIndex])
    }
  }

  const sortFunctions = {
    date: (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at),
    status: (a, b) => statuses.indexOf(a.status) - statuses.indexOf(b.status),
    priority: (a, b) => priorities.indexOf(a.priority) - priorities.indexOf(b.priority),
  };
  
  const sortedReports = useMemo(() => {
    const sortFunction = sortFunctions[sortField] || (() => 0);
    
    return [...reports].sort((a, b) => {
      const orderFactor = sortOrder === 'asc' ? 1 : -1;
      return orderFactor * sortFunction(a, b);
    });
  }, [reports, sortField, sortOrder]);
  

  useEffect(() => {
    const newUnopenedCount = reports.filter(
      (report) => report.status === "Unopened"
    ).length
    setUnopenedCount(newUnopenedCount)
  }, [reports])

  const getFlagColor = (reportId, priority, status) => {
    return flagColors[reportId]
      ? flagColors[reportId]
      : status === "Resolved"
      ? "green"
      : priority === "High"
      ? "red"
      : priority === "Medium"
      ? "orange"
      : priority === "Low"
      ? "yellow"
      : ""
  }

  const handleAdminSetColor = (reportId, color) => {
    setFlagColors({
      ...flagColors,
      [reportId]: color,
    })
  }

  const handlePriorityChange = async (reportId, currentPriority) => {
    const newPriorityClicks = { ...priorityClicks }
    newPriorityClicks[reportId] = (newPriorityClicks[reportId] || 0) + 1

    if (newPriorityClicks[reportId] > 4) {
      newPriorityClicks[reportId] = 1
    }

    const nextPriority = priorities[newPriorityClicks[reportId] - 1]
    setPriorityClicks(newPriorityClicks)

    const myHeaders = new Headers()
    myHeaders.append("Authorization", `Bearer ${token}`)

    try {
      const response = await fetch(
        `https://whistle-blower-server.vercel.app/reports/${reportId}/priority`,
        {
          method: "PUT",
          headers: myHeaders,
          body: JSON.stringify({ priority: nextPriority }),
        }
      )

      if (response.ok) {
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === reportId
              ? { ...report, priority: nextPriority }
              : report
          )
        )
        console.log(`Priority of report ${reportId} changed to ${nextPriority}`)
      } else {
        console.error(
          `Failed to change priority for report ${reportId}: ${response.status}`
        )
      }
    } catch (error) {
      console.error(`Failed to change priority for report ${reportId}:`, error)
    }
  }

  const handleStatusChange = async (reportId, currentStatus) => {
    const currentStatusIndex = statuses.indexOf(currentStatus)
    const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
    const nextStatus = statuses[nextStatusIndex]

    const myHeaders = new Headers()
    myHeaders.append("Authorization", `Bearer ${token}`)

    try {
      const response = await fetch(
        `https://whistle-blower-server.vercel.app/reports/${reportId}/status`,
        {
          method: "PUT",
          headers: myHeaders,
          body: JSON.stringify({ status: nextStatus }),
        }
      )

      if (response.ok) {
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === reportId ? { ...report, status: nextStatus } : report
          )
        )
        setStatusMessage(`Report ${reportId} changed to ${nextStatus}`)
        console.log(`Status of report ${reportId} changed to ${nextStatus}`)
      } else {
        console.error(
          `Failed to change status for report ${reportId}: ${response.status}`
        )
      }
    } catch (error) {
      console.error(`Failed to change status for report ${reportId}:`, error)
    }
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Admin Dashboard</h1>
      </header>
      <div className="main">
        <aside className="sidebar">
          <ul className="menu">
            <li>
              <FaInbox size={18} />
              <span style={{ color: unopenedCount > 0 ? "red" : "inherit" }}>
                Inbox ({reports.length})
                {unopenedCount > 0 && ` (${unopenedCount} new)`}
              </span>
              Inbox
            </li>
            <li>
              <FaFileAlt size={18} /> Reports
            </li>
            <li>
              <FaDraft2Digital size={18} /> Drafts
            </li>
          </ul>
          <div className="buttons-admin">
            <button onClick={() => navigate("/create-new-admin")}>
              Create New Admin
            </button>
            <NewCategoryComponent />
          </div>
        </aside>
        <section className="content">
          <div className="sort-options">
            <label>Sort By: </label>
            <span onClick={() => setSortField("date")} title="Sort by Date">
              <FaCalendarAlt size={18} />
            </span>
            <span onClick={() => setSortField("status")} title="Sort by Status">
              <FaRegCheckCircle size={18} />
            </span>
            <span
              onClick={() => setSortField("category")}
              title="Sort by Category"
            >
              <FaTags size={18} />
            </span>
            <span
              onClick={() => setSortField("priority")}
              title="Sort by Priority"
            >
              <FaExclamationTriangle size={18} />
            </span>

            {/*<span
              onClick={() => setSortOrder("desc")}
              title="Descending Order"
            >  <button onClick={toggleSortOrder}>
              Toggle Sort Order (Current: {sortOrder})
            </button></span>*/}
          </div>
          {/*<h2>Admin Inbox</h2>*/}
          <div className="report-section">
            <table className={`report-table ${showDetailView ? "hidden" : ""}`}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report, index) => (
                  <tr
                    key={report.id}
                    onClick={() => handleReportClick(report, index)}
                  >
                    <td>{report.title}</td>
                    <td>
                      {report.submitted_at
                        ? new Date(report.submitted_at).toLocaleDateString()
                        : "Date Not Available"}
                    </td>
                    <td>
                      <FaFlag
                        style={{
                          color: getFlagColor(
                            report.id,
                            report.priority,
                            report.status
                          ),
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {showDetailView && (
              <div className="report-details">
                <div className="detail-actions">
                  <div className="right">
                    {selectedReport && selectedReport.id && (
                      <GenerateReportHTML report={selectedReport} />
                    )}
                  </div>
                  <div className="left">
                    {currentIndex > 0 && (
                      <button onClick={() => navigateReport("prev")}>
                        <FaArrowLeft />
                      </button>
                    )}
                    {currentIndex < sortedReports.length - 1 && (
                      <button onClick={() => navigateReport("next")}>
                        <FaArrowRight />
                      </button>
                    )}
                    {/*<FaFlag
                      style={{
                        color: getFlagColor(
                          selectedReport.id,
                          selectedReport.priority,
                          selectedReport.status
                        ),
                      }}
                    />*/}
                    <button
                      onClick={() => {
                        handleAdminSetColor(selectedReport.id, "yellow")
                        handlePriorityChange(
                          selectedReport.id,
                          selectedReport.priority
                        )
                      }}
                    >
                      Low
                    </button>
                    <button
                      onClick={() => {
                        handleAdminSetColor(selectedReport.id, "orange")
                        handlePriorityChange(
                          selectedReport.id,
                          selectedReport.priority
                        )
                      }}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => {
                        handleAdminSetColor(selectedReport.id, "red")
                        handlePriorityChange(
                          selectedReport.id,
                          selectedReport.priority
                        )
                      }}
                    >
                      High
                    </button>
                    <button
                      onClick={() => {
                        handleAdminSetColor(selectedReport.id, "green")
                        handlePriorityChange(
                          selectedReport.id,
                          selectedReport.priority
                        )
                      }}
                    >
                      Resolved
                    </button>
                    <button onClick={() => setShowDetailView(false)}>
                      Go Back
                    </button>
                  </div>
                </div>

                <div className="detailes">
                  <div className="detailed-header">
                    {/*<h3>Report Details</h3> */}
                    <p className="detailed-status">
                      Status: {selectedReport.status}
                      {statusMessage && <span> ({statusMessage})</span>}
                    </p>{" "}
                    {/*<button
                      onClick={() =>
                        handleStatusChange(
                          selectedReport.id,
                          selectedReport.status
                        )
                      }
                    >
                      Change Status
                    </button>*/}
                  </div>
                  <div
                    className="report-content"
                    style={{ overflowY: "scroll", maxHeight: "400px" }}
                  >
                    <p className="detailed-title">{selectedReport.title}</p>
                    <p className="detailed-description">
                      {selectedReport.description}
                    </p>
                    {selectedReport.media && (
                      <p className="detailed-media">
                        Media:{" "}
                        <a
                          href={selectedReport.media}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Media
                        </a>
                        {/*[TODO: Display media here]*/}
                      </p>
                    )}{" "}
                    {/*<p className="detailed-category">
                      Category: {selectedReport.category}
                    </p>{" "}*/}
                  </div>
                  <ReplyComponent reportId={selectedReport} userId={userId} />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard
