import React, { useState } from "react";
import "./Contact.css";
import {
  Button,
  TextField,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";

const Contact = () => {
  const [formData, setFormData] = useState({ email: "", message: "" });
  const [snackbar, setSnackbar] = useState({
    open: false,
    success: true,
    text: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.message) {
      setSnackbar({
        open: true,
        success: false,
        text: "Please fill in all fields.",
      });
      return;
    }

    const subject = encodeURIComponent("Contact Form Message");
    const body = encodeURIComponent(`From: ${formData.email}\n\n${formData.message}`);

    // Replace this with your actual email
    window.location.href = `mailto:srprss003@gmail.com?subject=${subject}&body=${body}`;

    setFormData({ email: "", message: "" });
    setSnackbar({
      open: true,
      success: true,
      text: "Your email app should open now.",
    });
  };

  return (
    <div className="contactContainer">
      <form className="contactForm" onSubmit={handleSubmit}>
        <Typography
          variant="h5"
          component="h2"
          align="center"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Contact Us
        </Typography>

        <TextField
          label="Your Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
        />

        <TextField
          label="Your Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
          multiline
          rows={4}
          sx={{ mt: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Send Message
        </Button>

        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ mt: 2 }}
        >
          If the email app doesn’t open, send your message to{" "}
          <a href="mailto:srprss003@gmail.com">srprss003@gmail.com</a>.
        </Typography>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.success ? "success" : "error"}
          variant="filled"
        >
          {snackbar.text}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Contact;
