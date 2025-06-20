import React from "react";
import ErrorIcon from "@mui/icons-material/Error";
import "./NotFound.css";
import { Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="PageNotFound" role="alert" style={{ textAlign: "center", padding: "2rem" }}>
      <ErrorIcon color="error" style={{ fontSize: 60, marginBottom: 16 }} />
      <Typography variant="h5" gutterBottom>
        Page Not Found
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        Go to Home
      </Button>
    </div>
  );
};

export default NotFound;
