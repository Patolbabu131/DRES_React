import React, { useEffect, useRef, useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const SESSION_TIMEOUT = 45 * 60 * 1000; // 45 minutes
const WARNING_TIME = 9000; // 9 seconds before expiry

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const toastIdRef = useRef(null); // Track the toast ID

  // Mounted flag to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
      clearTimeout(warningTimerRef.current);
      clearInterval(countdownIntervalRef.current);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  // Show the expiration warning
  const showExpiryWarning = useCallback(() => {
    if (!mountedRef.current) return;
    setShowWarning(true);
    setCountdown(Math.ceil(WARNING_TIME / 1000));

    countdownIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Display the toast and store its ID
    toastIdRef.current = toast.loading(
      "Your session is about to expire due to inactivity",
      {
        duration: Infinity, // Keep toast until explicitly dismissed
      }
    );
  }, []);

  // Reset the timer
  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warningTimerRef.current);
    clearInterval(countdownIntervalRef.current);

    if (mountedRef.current) {
      setShowWarning(false);
      setCountdown(0);
    }

    // Dismiss the toast only if it exists
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    // Set new timers
    warningTimerRef.current = setTimeout(() => {
      showExpiryWarning();
    }, SESSION_TIMEOUT - WARNING_TIME);

    timerRef.current = setTimeout(() => {
      localStorage.removeItem("token");
      navigate("/", { replace: true });
    }, SESSION_TIMEOUT);
  }, [navigate, showExpiryWarning]);

  // Set up event listeners
  useEffect(() => {
    if (!token) return;

    const events = ["mousemove", "keydown", "touchstart", "scroll"];
    const handleActivity = () => {
      // Only reset the timer if the warning isn't active
      if (!showWarning) {
        resetTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(timerRef.current);
      clearTimeout(warningTimerRef.current);
      clearInterval(countdownIntervalRef.current);
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [token, resetTimer, showWarning]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Session Timeout Warning
            </h2>
            <p className="text-gray-600 mb-6">
              Your session will expire in {countdown} seconds due to inactivity.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={resetTimer}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Continue Session
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/", { replace: true });
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Log Out Now
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;