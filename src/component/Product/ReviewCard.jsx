import React from "react";
import { Rating } from "@mui/material";
import profilePng from "../../images/Profile.png";

const ReviewCard = ({ review }) => {
  return (
    <div className="reviewCard">
      <img src={profilePng} alt="User" />
      <p>{review.name}</p>
      <Rating value={review.rating} readOnly precision={0.5} />
      <span className="reviewCardComment">{review.comment}</span>
    </div>
  );
};

export default ReviewCard;
