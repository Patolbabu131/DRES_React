import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate("/materialtransfer");
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-darkSurface rounded-lg shadow-sm p-6 border border-lightPrimary/20 dark:border-darkPrimary/20">
          <h2 className="text-2xl font-semibold text-lightPrimary dark:text-darkPrimary mb-4">
            Welcome back, John
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Start managing your business operations from this centralized dashboard.
          </p>
          <button
            onClick={handleRedirect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
          >
            Go to Material Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
