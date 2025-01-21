import React, { createContext, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Create Toast Context
const ToastContext = createContext();

// ToastProvider Component
export const ToastProvider = ({ children }) => {
  const showToast = (message, type = "default") => {
    toast[type](message);
  };

  const PositiveToast = (message) => {
    toast.success(message, {
      style: {
        backgroundColor: "#d4edda",
        color: "#155724",
        border: "1px solid #c3e6cb",
      },
    });
  };

  const NegativeToast = (message) => {
    toast.error(message, {
      style: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        border: "1px solid #f5c6cb",
      },
    });
  };

  return (
    <ToastContext.Provider value={{ showToast, PositiveToast, NegativeToast }}>
      {children}
      <ToastContainer position="top-right" autoClose={3000} />
    </ToastContext.Provider>
  );
};

// Custom Hook to Use Toast
export const useToast = () => useContext(ToastContext);
