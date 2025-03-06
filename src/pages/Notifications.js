// src/components/Notifications.js
import React from "react";
import { useNotification } from "../context/NotificationContext";
import "./Notifications.css"; // Adjust the path as needed

const Notifications = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

  if (loading) return <p>Loading notifications...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="notifications__container">
      <h2 className="notifications__heading">Notifications</h2>
      <p className="notifications__unread">Unread: {unreadCount}</p>
      {notifications.length > 0 && (
        <button className="notifications__mark-all-btn" onClick={markAllAsRead}>
          Mark All as Read
        </button>
      )}
      {notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        <ul className="notifications__list">
          {notifications.map((notification) => (
            <li
              key={notification._id}
              className={`notifications__item ${
                notification.read ? "notifications__item--read" : ""
              }`}
            >
              <div className="notifications__info">
                <p>
                  <strong>Site:</strong> {notification.site_url}
                </p>
                <p>
                  <strong>Message:</strong> {notification.message}
                </p>
                <p>
                  <strong>Type:</strong> {notification.type}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="notifications__actions">
                {!notification.read && (
                  <button
                    className="notifications__action-btn"
                    onClick={() => markAsRead(notification._id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  className="notifications__delete-btn"
                  onClick={() => deleteNotification(notification._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
