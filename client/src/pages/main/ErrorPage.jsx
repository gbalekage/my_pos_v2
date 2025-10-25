import React from "react";
import { Link } from "react-router-dom";

const ErrorPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>
        <h1 className="mb-4">Error Page</h1>
        <Link to={"/"}>Home page</Link>
      </div>
    </div>
  );
};

export default ErrorPage;
