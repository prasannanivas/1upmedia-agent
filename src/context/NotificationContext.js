// src/context/NotificationContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext"; // adjust the path as needed

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { authState } = useAuth();
  const { email } = authState;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications for the given email
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/notifications/${email}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/notifications/${email}/read/${notificationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/notifications/${email}/mark-all-read`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `https://ai.1upmedia.com:443/aiagent/notifications/${email}/${notificationId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Fetch notifications when email is available or changes
  useEffect(() => {
    if (email) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // Calculate unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
