import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function Protected({ children, isAdmin= false }) {
  const user = useSelector((state) => state.auth?.userData);

  if (!user) {
    return <Navigate to="/login" replace={true}></Navigate>;
  }
  if (isAdmin && user.role !== "admin") {
    return <Navigate to="/unauthorized" replace={true} />;
  }

  return children;
}

export default Protected;