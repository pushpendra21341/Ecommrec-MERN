import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

const navItems = [
  { text: "Home", url: "/" },
  { text: "Products", url: "/products" },
  { text: "Contact", url: "/contact" },
  { text: "About", url: "/about" },
];

const Header = () => {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const panelsRef = useRef([]);
  const titleRef = useRef(null);
  const menuItemsRef = useRef([]);
  const iconsRef = useRef([]);

  useEffect(() => {
    if (overlayOpen) {
      gsap.fromTo(
        panelsRef.current.filter(Boolean),
        { y: "-100%" },
        {
          y: "0%",
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          onComplete: () => {
            gsap.fromTo(
              titleRef.current,
              { x: -120, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.7, ease: "back.out(1.7)" }
            );

            gsap.fromTo(
              menuItemsRef.current.filter(Boolean),
              { y: -40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.1,
              }
            );

            gsap.fromTo(
              iconsRef.current.filter(Boolean),
              { x: 120, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 0.7,
                ease: "back.out(1.7)",
                stagger: 0.1,
              }
            );
          },
        }
      );
    } else {
      const elements = [
        titleRef.current,
        ...menuItemsRef.current.filter(Boolean),
        ...iconsRef.current.filter(Boolean),
      ];

      gsap.to(elements, {
        opacity: 0,
        y: -50,
        duration: 0.3,
        ease: "power2.in",
      });

      gsap.to(panelsRef.current.filter(Boolean), {
        y: "-100%",
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.in",
      });
    }
  }, [overlayOpen]);

  const toggleOverlay = () => {
    setOverlayOpen((prev) => !prev);
  };

  return (
    <>
      {!overlayOpen && (
        <Box sx={{ position: "fixed", top: 16, left: 16, zIndex: 1500 }}>
          <IconButton
            aria-label="open menu"
            onClick={toggleOverlay}
            sx={{
              color: "black",
              bgcolor: "white",
              boxShadow: 2,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: overlayOpen ? "block" : "none",
          zIndex: 1400,
          overflow: "hidden",
        }}
      >
        {/* Background Panels */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Box
            key={i}
            ref={(el) => (panelsRef.current[i] = el)}
            sx={{
              position: "absolute",
              top: 0,
              left: `${i * 20}%`,
              width: "20%",
              height: "100%",
              backgroundColor: "white",
              transform: "translateY(-100%)",
              zIndex: 1,
            }}
          />
        ))}

        {/* Close Button */}
        <IconButton
          onClick={toggleOverlay}
          sx={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 1600,
            color: "black",
            bgcolor: "white",
            boxShadow: 2,
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
          }}
          aria-label="close menu"
        >
          <CloseIcon fontSize="large" />
        </IconButton>

        {/* Content Box */}
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "center",
            textAlign: { xs: "center", md: "left" },
            width: "90vw",
            maxWidth: "1000px",
            color: "black",
            zIndex: 1500,
            userSelect: "none",
            whiteSpace: "nowrap",
            fontFamily: "'Roboto', sans-serif",
            gap: { xs: 4, md: 0 },
          }}
        >
          {/* Logo Title */}
          <Box
            sx={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              cursor: "default",
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            <Typography
              ref={titleRef}
              variant="h4"
              sx={{
                opacity: 0,
                lineHeight: 1,
                color: "black",
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              ecommerce
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box
            sx={{
              flex: "1 1 auto",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "center",
              alignItems: "center",
              gap: { xs: 2, md: 6 },
              marginLeft: { xs: 0, md: 6 },
            }}
          >
            {navItems.map((item, index) => (
              <Typography
                key={item.text}
                component={Link}
                to={item.url}
                onClick={toggleOverlay}
                ref={(el) => (menuItemsRef.current[index] = el)}
                sx={{
                  color: "black",
                  textDecoration: "none",
                  fontSize: { xs: "1.25rem", md: "1.5rem" },
                  opacity: 0,
                  cursor: "pointer",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {item.text}
              </Typography>
            ))}
          </Box>

          {/* Icons */}
          <Box
            sx={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: { xs: "row", md: "row" },
              gap: 3,
              alignItems: "center",
              marginLeft: { xs: 0, md: 6 },
              justifyContent: { xs: "center", md: "flex-start" },
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            {overlayOpen && (
              <>
                <Tooltip title="Search">
                  <IconButton
                    ref={(el) => (iconsRef.current[0] = el)}
                    component={Link}
                    to="/search"
                    onClick={toggleOverlay}
                    sx={{
                      color: "black",
                      p: 0,
                      display: "flex",
                      alignItems: "center",
                      opacity: 0,
                    }}
                    size="large"
                  >
                    <SearchIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Cart">
                  <IconButton
                    ref={(el) => (iconsRef.current[1] = el)}
                    component={Link}
                    to="/cart"
                    onClick={toggleOverlay}
                    sx={{
                      color: "black",
                      p: 0,
                      display: "flex",
                      alignItems: "center",
                      opacity: 0,
                    }}
                    size="large"
                  >
                    <ShoppingCartIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Profile">
                  <IconButton
                    ref={(el) => (iconsRef.current[2] = el)}
                    component={Link}
                    to="/login"
                    onClick={toggleOverlay}
                    sx={{
                      color: "black",
                      p: 0,
                      display: "flex",
                      alignItems: "center",
                      opacity: 0,
                    }}
                    size="large"
                  >
                    <AccountCircleIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Header;