import React from "react";
import "./aboutSection.css";
import { Button, Typography, Avatar } from "@mui/material";
import YouTubeIcon from "@mui/icons-material/YouTube";
import InstagramIcon from "@mui/icons-material/Instagram";

const About = () => {
  const visitInstagram = () => {
    window.location.href = "https://instagram.com/yourusername";
  };

  return (
    <div className="aboutSection">
      <div></div>
      <div className="aboutSectionGradient"></div>
      <div className="aboutSectionContainer">
        <Typography component="h1">About Me</Typography>

        <div>
          <div>
            <Avatar
              style={{ width: "10vmax", height: "10vmax", margin: "2vmax 0" }}
              src="https://yourdomain.com/your-avatar.jpg"
              alt="Your Name"
            />
            <Typography>Your Name</Typography>
            <Button onClick={visitInstagram} color="primary">
              Visit Instagram
            </Button>
            <span>
              Hi! I'm Your Name, a passionate developer/designer/content creator.
              I love building full-stack apps, sharing knowledge, and connecting
              with others in the tech space.
            </span>
          </div>
          <div className="aboutSectionContainer2">
            <Typography component="h2">Find Me Online</Typography>
            <a
              href="https://www.youtube.com/channel/YOUR_CHANNEL_ID"
              target="_blank"
              rel="noopener noreferrer"
            >
              <YouTubeIcon className="youtubeSvgIcon" />
            </a>

            <a
              href="https://instagram.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon className="instagramSvgIcon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;