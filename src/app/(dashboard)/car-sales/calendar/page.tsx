"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle,
  Loader2, Check, X, ArrowLeft, Bell, Filter,
} from "lucide-react";

interface Reminder {
  id: string;
  leadId: string;
  reminderDate: string;
  reminderType: string;
  notes?: string | null;
  isCompleted: boolean;
  createdAt: string;
  lead?: {
    id: string;
    customer?: {
      name: string;
      phone: string;
    };
    carType?: string;
    registrationNumber?: string;
  };
  staffId?: string | null;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch reminders
  useEffect(() => {
    async function fetchReminders() {
      try {
        setLoading(true);
        const res = await fetch("/api/car-sales/reminders");
        if (res.ok) {
          const data = await res.json();
          setReminders(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch reminders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReminders();
  }, []);

  // Mark reminder as done
  async function markComplete(reminderId: string) {
    setCompleting(reminderId);
    try {
      const res = await fetch(`/api/car-sales/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (res.ok) {
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminderId ? { ...r, isCompleted: true } : r
          )
        );
      }
    } catch (error) {
      console.error("Failed to complete reminder:", error);
    } finally {
      setCompleting(null);
    }
  }

  // Mark reminder as incomplete
  async function markIncomplete(reminderId: string) {
    setCompleting(reminderId);
    try {
      const res = await fetch(`/api/car-sales/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: false }),
      });

      if (res.ok) {
        setReminders((prev) =>
          prev.map((r) =>
            r.id === reminderId ? { ...r, isCompleted: false } : r
          )
        );
      }
    } catch (error) {
      console.error("Failed to update reminder:", error);
    } finally {
      setCompleting(null);
    }
  }

  // Sync reminders to Google Calendar
  async function syncToGoogleCalendar() {
    setSyncing(true);
    try {
      const res = await fetch("/api/car-sales/calendar/sync-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Sync successful:", data.message);
        alert(`✅ Synced ${data.synced} reminders to Google Calendar!`);
      } else {
        const error = await res.json();
        console.error("❌ Sync failed:", error);
        alert(`❌ Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to sync calendar:", error);
      alert("❌ Failed to sync with Google Calendar");
    } finally {
      setSyncing(false);
    }
  }

  // Get calendar data
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Get reminders for a specific date
  const getRemindersForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reminders.filter((r) =>
      r.reminderDate.startsWith(dateStr) &&
      (!filterCompleted || !r.isCompleted)
    );
  };

  // Get reminders for selected date
  const selectedDateReminders = selectedDate
    ? reminders.filter((r) =>
        r.reminderDate.startsWith(selectedDate) &&
        (!filterCompleted || !r.isCompleted)
      )
    : [];

  // Get upcoming reminders
  const upcomingReminders = reminders
    .filter((r) => !r.isCompleted && new Date(r.reminderDate) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
    )
    .slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", padding: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Reminders & Calendar
          </h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={syncToGoogleCalendar}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "var(--brand)",
              border: "1px solid var(--brand)",
              borderRadius: "8px",
              color: "#000",
              fontSize: "13px",
              fontWeight: 600,
              cursor: syncing ? "not-allowed" : "pointer",
              opacity: syncing ? 0.7 : 1,
            }}
          >
            {syncing ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Syncing...
              </>
            ) : (
              <>
                <Calendar size={14} /> Sync to Google
              </>
            )}
          </button>
          <button
            onClick={() => setFilterCompleted(!filterCompleted)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: filterCompleted ? "var(--brand)" : "var(--bg-card)",
              border: `1px solid ${filterCompleted ? "var(--brand)" : "var(--border)"}`,
              borderRadius: "8px",
              color: filterCompleted ? "#000" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Filter size={14} /> {filterCompleted ? "Pending" : "All"}
          </button>
        </div>
      </div>

      {/* Main content - Calendar and details */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Calendar section */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflow: "auto",
          }}
        >
          {/* Month Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                )
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
                display: "flex",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", minWidth: "150px", textAlign: "center" }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                )
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
                display: "flex",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {days.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  paddingBottom: "8px",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {calendarDays.map((day, idx) => {
              const dateStr = day
                ? `${currentDate.getFullYear()}-${String(
                    currentDate.getMonth() + 1
                  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;
              const dayReminders = day ? getRemindersForDate(day) : [];
              const isSelected = selectedDate === dateStr;
              const isToday =
                day &&
                new Date().toDateString() ===
                  new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    aspectRatio: "1",
                    padding: "4px",
                    border: `1px solid ${isSelected ? "var(--brand)" : "var(--border)"}`,
                    borderRadius: "8px",
                    backgroundColor:
                      isSelected
                        ? "rgba(16,185,129,0.1)"
                        : isToday
                          ? "rgba(16,185,129,0.05)"
                          : "transparent",
                    cursor: day ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: day ? 1 : 0.3,
                    color: "var(--text-secondary)",
                  }}
                  disabled={!day}
                >
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>{day}</span>
                  {dayReminders.length > 0 && (
                    <span
                      style={{
                        fontSize: "9px",
                        marginTop: "2px",
                        padding: "1px 4px",
                        backgroundColor: "var(--brand)",
                        color: "#000",
                        borderRadius: "3px",
                        fontWeight: 700,
                      }}
                    >
                      {dayReminders.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel - Selected date reminders or upcoming */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflow: "auto",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "14px",
            }}
          >
            <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px", textTransform: "uppercase" }}>
              {selectedDate ? `${new Date(selectedDate).toLocaleDateString("en-KE", { weekday: "long", month: "short", day: "numeric" })}` : "Upcoming Reminders"}
            </h3>

            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px" }}>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading...
              </div>
            ) : selectedDate ? (
              selectedDateReminders.length === 0 ? (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>No reminders for this date</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedDateReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      style={{
                        padding: "10px 12px",
                        backgroundColor: "var(--bg-app)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-start",
                      }}
                    >
                      <button
                        onClick={() =>
                          reminder.isCompleted
                            ? markIncomplete(reminder.id)
                            : markComplete(reminder.id)
                        }
                        disabled={completing === reminder.id}
                        style={{
                          background: "none",
                          border: `1px solid ${reminder.isCompleted ? "var(--brand)" : "var(--border)"}`,
                          borderRadius: "4px",
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: reminder.isCompleted ? "var(--brand)" : "var(--text-muted)",
                          marginTop: "1px",
                        }}
                      >
                        {reminder.isCompleted && <Check size={12} />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: reminder.isCompleted ? "var(--text-muted)" : "#ffffff",
                            margin: 0,
                            textDecoration: reminder.isCompleted ? "line-through" : "none",
                          }}
                        >
                          {reminder.reminderType}
                        </p>
                        {reminder.lead && (
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                            {reminder.lead.customer?.name}
                          </p>
                        )}
                        {reminder.notes && (
                          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0", fontStyle: "italic" }}>
                            {reminder.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : upcomingReminders.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>No upcoming reminders</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {upcomingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--bg-app)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                  >
                    <button
                      onClick={() =>
                        reminder.isCompleted
                          ? markIncomplete(reminder.id)
                          : markComplete(reminder.id)
                      }
                      disabled={completing === reminder.id}
                      style={{
                        background: "none",
                        border: `1px solid ${reminder.isCompleted ? "var(--brand)" : "var(--border)"}`,
                        borderRadius: "4px",
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: reminder.isCompleted ? "var(--brand)" : "var(--text-muted)",
                        marginTop: "1px",
                      }}
                    >
                      {reminder.isCompleted && <Check size={12} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: reminder.isCompleted ? "var(--text-muted)" : "#ffffff",
                          margin: 0,
                          textDecoration: reminder.isCompleted ? "line-through" : "none",
                        }}
                      >
                        {reminder.reminderType}
                      </p>
                      <p style={{ fontSize: "10px", color: "var(--brand)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Clock size={10} />
                        {new Date(reminder.reminderDate).toLocaleString("en-KE", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {reminder.lead && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                          {reminder.lead.customer?.name}
                        </p>
                      )}
                      {reminder.notes && (
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0", fontStyle: "italic" }}>
                          {reminder.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
