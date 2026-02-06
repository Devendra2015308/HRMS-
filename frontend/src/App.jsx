import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { api } from "./api";

const today = new Date().toISOString().split("T")[0];
const apiBase =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(
    /\/+$/,
    ""
  );

function App() {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceEmployee, setAttendanceEmployee] = useState(null);
  const [toast, setToast] = useState("");
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const toastTimeoutRef = useRef(null);

  const [employeeForm, setEmployeeForm] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    department: "",
  });
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);

  const [attendanceForm, setAttendanceForm] = useState({
    date: today,
    status: "present",
  });
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState({
    from: "",
    to: "",
  });

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.employee_id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );
  const employeeDetails = useMemo(
    () => attendanceEmployee || selectedEmployee,
    [attendanceEmployee, selectedEmployee]
  );

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const handleError = useCallback((error, fallback) => {
    console.error(error);
    showToast(error?.message || fallback);
  }, [showToast]);

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setEmployeesError("");
    try {
      const data = await api.listEmployees();
      setEmployees(data);
      if (!selectedEmployeeId && data.length) {
        setSelectedEmployeeId(data[0].employee_id);
      } else if (
        selectedEmployeeId &&
        !data.find((e) => e.employee_id === selectedEmployeeId)
      ) {
        setSelectedEmployeeId(data[0]?.employee_id || "");
      }
    } catch (err) {
      setEmployeesError(err.message || "Unable to fetch employees.");
      handleError(err, "Unable to fetch employees.");
    } finally {
      setEmployeesLoading(false);
    }
  }, [selectedEmployeeId, handleError]);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (err) {
      handleError(err, "Unable to fetch dashboard data.");
    } finally {
      setDashboardLoading(false);
    }
  }, [handleError]);

  const loadAttendance = useCallback(async (employeeId, filter) => {
    if (!employeeId) return;
    setAttendanceLoading(true);
    try {
      const data = await api.listAttendance(employeeId, filter);
      setAttendance(data.attendance || []);
      setAttendanceSummary(data.summary || null);
      setAttendanceEmployee(data.employee || null);
    } catch (err) {
      handleError(err, "Unable to fetch attendance.");
      setAttendance([]);
      setAttendanceSummary(null);
      setAttendanceEmployee(null);
    } finally {
      setAttendanceLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    loadEmployees();
    loadDashboard();
  }, [loadEmployees, loadDashboard]);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadAttendance(selectedEmployeeId, attendanceFilter);
    }
  }, [selectedEmployeeId, loadAttendance]);

  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    },
    []
  );

  async function handleAddEmployee(e) {
    e.preventDefault();
    setEmployeeSubmitting(true);
    try {
      const payload = {
        ...employeeForm,
        employee_id: employeeForm.employee_id.trim(),
        full_name: employeeForm.full_name.trim(),
        email: employeeForm.email.trim().toLowerCase(),
        department: employeeForm.department.trim(),
      };
      const created = await api.createEmployee(payload);
      setEmployees((prev) =>
        [...prev, created].sort((a, b) =>
          a.employee_id.localeCompare(b.employee_id)
        )
      );
      setEmployeeForm({
        employee_id: "",
        full_name: "",
        email: "",
        department: "",
      });
      setSelectedEmployeeId(created.employee_id);
      showToast("Employee added successfully.");
      loadDashboard();
    } catch (err) {
      handleError(err, "Unable to add employee.");
    } finally {
      setEmployeeSubmitting(false);
    }
  }

  async function handleDeleteEmployee(employeeId) {
    const employee = employees.find((e) => e.employee_id === employeeId);
    const confirmed = window.confirm(
      `Delete employee ${employee?.full_name || employeeId}?`
    );
    if (!confirmed) return;

    try {
      await api.deleteEmployee(employeeId);
      setEmployees((prev) =>
        prev.filter((emp) => emp.employee_id !== employeeId)
      );
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId(
          employees.filter((emp) => emp.employee_id !== employeeId)[0]
            ?.employee_id || ""
        );
        setAttendance([]);
        setAttendanceSummary(null);
        setAttendanceEmployee(null);
        setShowEmployeeModal(false);
      }
      showToast("Employee deleted.");
      loadDashboard();
    } catch (err) {
      handleError(err, "Unable to delete employee.");
    }
  }

  async function handleMarkAttendance(e) {
    e.preventDefault();
    if (!selectedEmployeeId) {
      showToast("Select an employee first.");
      return;
    }
    setAttendanceSubmitting(true);
    try {
      await api.createAttendance(selectedEmployeeId, {
        date: attendanceForm.date,
        status: attendanceForm.status,
      });
      showToast("Attendance saved.");
      loadAttendance(selectedEmployeeId, attendanceFilter);
      loadDashboard();
    } catch (err) {
      handleError(err, "Unable to save attendance.");
    } finally {
      setAttendanceSubmitting(false);
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setAttendanceFilter((prev) => ({ ...prev, [name]: value }));
  }

  function applyAttendanceFilter(e) {
    e.preventDefault();
    if (selectedEmployeeId) {
      loadAttendance(selectedEmployeeId, attendanceFilter);
    }
  }

  const handleCloseEmployeeModal = useCallback(() => {
    setShowEmployeeModal(false);
  }, []);

  const handleViewEmployee = useCallback(
    (employee) => {
      setAttendanceEmployee(employee);
      setSelectedEmployeeId(employee.employee_id);
      setShowEmployeeModal(true);
    },
    []
  );

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">HRMS Lite</p>
          <h1>Employee & Attendance Manager</h1>
          <p className="subtitle">
            Production-ready CRUD with validations, summaries, and clean UX.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Snapshot</p>
            <h2>Dashboard</h2>
          </div>
          <button className="ghost" onClick={loadDashboard} disabled={dashboardLoading}>
            Refresh
          </button>
        </div>
        {dashboardLoading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <div className="stats-grid">
            <Stat label="Employees" value={dashboard?.employees ?? 0} />
            <Stat
              label="Attendance Records"
              value={dashboard?.attendance_records ?? 0}
            />
            <Stat label="Present Days" value={dashboard?.present_days ?? 0} />
            <Stat label="Absent Days" value={dashboard?.absent_days ?? 0} />
          </div>
        )}
      </section>

      <div className="panels-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Employees</p>
              <h2>Add Employee</h2>
            </div>
            <div className="hint">Unique ID & valid email required</div>
          </div>
          <form className="form" onSubmit={handleAddEmployee}>
            <div className="field">
              <label htmlFor="employee_id">Employee ID</label>
              <input
                id="employee_id"
                name="employee_id"
                value={employeeForm.employee_id}
                onChange={(e) =>
                  setEmployeeForm((prev) => ({
                    ...prev,
                    employee_id: e.target.value,
                  }))
                }
                required
                placeholder="EMP-1001"
              />
            </div>
            <div className="field">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                value={employeeForm.full_name}
                onChange={(e) =>
                  setEmployeeForm((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                required
                placeholder="Name"
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={employeeForm.email}
                onChange={(e) =>
                  setEmployeeForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                required
                placeholder="abc@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                value={employeeForm.department}
                onChange={(e) =>
                  setEmployeeForm((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                required
                placeholder="Engineering"
              />
            </div>
            <button
              type="submit"
              className="primary"
              disabled={employeeSubmitting}
            >
              {employeeSubmitting ? "Saving..." : "Add Employee"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Directory</p>
              <h2>Employees</h2>
            </div>
            <div className="actions">
              <button className="ghost" onClick={loadEmployees} disabled={employeesLoading}>
                Refresh
              </button>
            </div>
          </div>
          {employeesLoading ? (
            <div className="loading">Loading employees...</div>
          ) : employeesError ? (
            <div className="error">{employeesError}</div>
          ) : employees.length === 0 ? (
            <div className="empty">No employees yet. Add the first record.</div>
          ) : (
            <div className="table">
              <div className="table-head">
                <span>ID</span>
                <span>Name</span>
                <span>Email</span>
                <span>Dept</span>
                <span>Actions</span>
              </div>
              {employees.map((emp) => (
                <div
                  key={emp.employee_id}
                  className={`table-row ${
                    emp.employee_id === selectedEmployeeId ? "active" : ""
                  }`}
                >
                  <span data-label="ID">{emp.employee_id}</span>
                  <span data-label="Name">{emp.full_name}</span>
                  <span data-label="Email">{emp.email}</span>
                  <span data-label="Dept">{emp.department}</span>
                  <span className="row-actions" data-label="Actions">
                    <button
                      className="ghost"
                      onClick={() => handleViewEmployee(emp)}
                    >
                      View
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDeleteEmployee(emp.employee_id)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="panels-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2>Mark Attendance</h2>
            </div>
            <div className="hint">Select an employee to log</div>
          </div>
          <form className="form" onSubmit={handleMarkAttendance}>
            <div className="field">
              <label htmlFor="employee">Employee</label>
              <select
                id="employee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.full_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <div className="field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) =>
                    setAttendanceForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={attendanceForm.status}
                  onChange={(e) =>
                    setAttendanceForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="primary"
              disabled={attendanceSubmitting || !selectedEmployeeId}
            >
              {attendanceSubmitting ? "Saving..." : "Save Attendance"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Records</p>
              <h2>Attendance Records</h2>
            </div>
            <div className="actions">
              <button
                className="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  if (selectedEmployeeId) loadAttendance(selectedEmployeeId, attendanceFilter);
                }}
                disabled={!selectedEmployeeId || attendanceLoading}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="filters">
            <div className="field">
              <label htmlFor="from">From</label>
              <input
                id="from"
                type="date"
                name="from"
                value={attendanceFilter.from}
                onChange={handleFilterChange}
              />
            </div>
            <div className="field">
              <label htmlFor="to">To</label>
              <input
                id="to"
                type="date"
                name="to"
                value={attendanceFilter.to}
                onChange={handleFilterChange}
              />
            </div>
            <button
              className="ghost"
              onClick={applyAttendanceFilter}
              disabled={!selectedEmployeeId}
            >
              Apply
            </button>
          </div>

          {attendanceLoading ? (
            <div className="loading">Loading attendance...</div>
          ) : !selectedEmployeeId ? (
            <div className="empty">Select an employee to view attendance.</div>
          ) : attendance.length === 0 ? (
            <div className="empty">No attendance records for this employee.</div>
          ) : (
            <>
              {attendanceSummary && (
                <div className="summary">
                  <div>
                    <span className="summary-label">Present</span>
                    <span className="summary-value">
                      {attendanceSummary.present_days}
                    </span>
                  </div>
                  <div>
                    <span className="summary-label">Absent</span>
                    <span className="summary-value">
                      {attendanceSummary.absent_days}
                    </span>
                  </div>
                  <div>
                    <span className="summary-label">Total</span>
                    <span className="summary-value">
                      {attendanceSummary.total_records}
                    </span>
                  </div>
                </div>
              )}
              <div className="table">
                <div className="table-head">
                  <span>Date</span>
                  <span>Status</span>
                </div>
                {attendance.map((record) => (
                  <div className="table-row" key={record.id}>
                    <span data-label="Date">{record.date}</span>
                    <span data-label="Status">
                      <StatusPill status={record.status} />
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {showEmployeeModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseEmployeeModal}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Employee</p>
                <h3>Details</h3>
              </div>
              <button className="ghost" onClick={handleCloseEmployeeModal}>
                Close
              </button>
            </div>
            {attendanceLoading && !attendanceEmployee ? (
              <div className="loading">Loading details...</div>
            ) : employeeDetails ? (
              <div className="details-grid">
                <DetailItem label="Employee ID" value={employeeDetails.employee_id} />
                <DetailItem label="Full Name" value={employeeDetails.full_name} />
                <DetailItem label="Email" value={employeeDetails.email} />
                <DetailItem label="Department" value={employeeDetails.department} />
                <DetailItem label="Created At" value={employeeDetails.created_at} />
              </div>
            ) : (
              <div className="empty">No employee selected.</div>
            )}

            {attendanceSummary && (
              <div className="modal-summary">
                <div>
                  <span className="summary-label">Present</span>
                  <span className="summary-value">
                    {attendanceSummary.present_days}
                  </span>
                </div>
                <div>
                  <span className="summary-label">Absent</span>
                  <span className="summary-value">
                    {attendanceSummary.absent_days}
                  </span>
                </div>
                <div>
                  <span className="summary-label">Total</span>
                  <span className="summary-value">
                    {attendanceSummary.total_records}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = status?.toLowerCase() || "";
  const isPresent = normalized === "present";
  return (
    <span className={`pill ${isPresent ? "present" : "absent"}`}>
      {isPresent ? "Present" : "Absent"}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || "-"}</span>
    </div>
  );
}

export default App;
