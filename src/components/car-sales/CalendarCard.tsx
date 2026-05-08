"use client";

import { useState, useEffect } from "react";
import {
  X, Calendar, Check, ChevronLeft, ChevronRight, Clock, AlertCircle,
  Loader2,
} from "lucide-react";

interface Reminder {
  id: string;
  leadId: string;
  reminderDate: string;
  reminderType: string;
  notes?: string | null;
  isCompleted: boolean;
  createdAt: string;
  staffId?: string | null;
}

interface CalendarEvent {
  date: string;
  reminders: Reminder[];
}

export function CalendarCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

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

  // Get calendar data
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Get reminders for a date
  const getRemindersForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reminders.filter((r) => r.reminderDate.startsWith(dateStr));
  };

  // Get all upcoming reminders
  const upcomingReminders = reminders
    .filter((r) => !r.isCompleted && new Date(r.reminderDate) >= new Date())
    .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
    .slice(0, 5);

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={16} color="var(--brand)" />
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Reminders
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isOpen ? <X size={16} /> : <Calendar size={16} />}
        </button>
      </div>

      {/* Calendar View / Reminders List */}
      {isOpen ? (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Month Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
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
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", minWidth: "100px", textAlign: "center" }}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
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

          {/* Calendar Grid */}
          <div>
            {/* Weekday Headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "6px 0",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "4px",
              }}
            >
              {days.map((day, idx) => {
                const dayReminders = getRemindersForDate(day);
                const hasReminders = dayReminders.length > 0;
                const isToday =
                  day &&
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={idx}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: day ? "var(--bg-app)" : "transparent",
                      border: day ? `1px solid var(--border)` : "none",
                      borderRadius: "8px",
                      position: "relative",
                      fontSize: "12px",
                      color: day ? "var(--text-primary)" : "transparent",
                      fontWeight: 600,
                      cursor: day ? "pointer" : "default",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (day) {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgba(10, 182, 210, 0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (day) {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-app)";
                      }
                    }}
                  >
                    {day && (
                      <>
                        {isToday && (
                          <div
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              width: "4px",
                              height: "4px",
                              backgroundColor: "var(--brand)",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        <span>{day}</span>
                        {hasReminders && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 3,
                              width: "6px",
                              height: "6px",
                              backgroundColor: "var(--brand)",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Google Calendar Placeholder */}
          <div
            style={{
              padding: "12px",
              backgroundColor: "rgba(10, 182, 210, 0.05)",
              border: "1px dashed rgba(10, 182, 210, 0.3)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            📅 Google Calendar API Integration Ready
            <br />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Configure via settings to sync calendars
            </span>
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                color: "var(--text-muted)",
              }}
            >
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
              Loading...
            </div>
          ) : upcomingReminders.length === 0 ? (
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <AlertCircle size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <p style={{ fontSize: "12px", margin: 0 }}>No upcoming reminders</p>
            </div>
          ) : (
            upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-app)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  transition: "all 0.2s",
                }}
              >
                <button
                  onClick={() => markComplete(reminder.id)}
                  disabled={completing === reminder.id}
                  style={{
                    background: "none",
                    border: `2px solid ${reminder.isCompleted ? "var(--brand)" : "var(--border)"}`,
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    minWidth: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "2px",
                    transition: "all 0.2s",
                  }}
                >
                  {reminder.isCompleted && <Check size={14} color="var(--brand)" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "2px",
                      textDecoration: reminder.isCompleted ? "line-through" : "none",
                      color: reminder.isCompleted ? "var(--text-muted)" : "#ffffff",
                    }}
                  >
                    {reminder.reminderType}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "4px",
                    }}
                  >
                    <Clock size={10} />
                    {new Date(reminder.reminderDate).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {reminder.notes && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        wordBreak: "break-word",
                      }}
                    >
                      {reminder.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
