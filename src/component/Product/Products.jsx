import React, { Fragment, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearErrors, getProduct } from "../../actions/productAction";
import Loader from "../layout/Loader/Loader";
import ProductCard from "../Home/ProductCard";
import ReactPaginate from "react-paginate";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MetaData from "../layout/MetaData";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Products.css";

const categories = [
  "Laptop",
  "Footwear",
  "Bottom",
  "Tops",
  "Attire",
  "Camera",
  "SmartPhones",
];

const Products = () => {
  const dispatch = useDispatch();
  const { keyword } = useParams();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  const [sliderPrice, setSliderPrice] = useState([0, 25000]);
  const [filterPrice, setFilterPrice] = useState([0, 25000]);

  const [category, setCategory] = useState("");
  const [ratings, setRatings] = useState(0);
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [tags, setTags] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [allBrands, setAllBrands] = useState([]);
  const [allStatuses, setAllStatuses] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const {
    products,
    loading,
    error,
    productsCount,
    resultPerPage,
    filteredProductsCount,
    minPrice,
    maxPrice,
  } = useSelector((state) => state.products);

  // Fetch filter metadata (brands, statuses, tags)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setFiltersLoading(true);
        const { data } = await axios.get("/api/v1/products/filters");
        setAllBrands(data.brands || []);
        setAllStatuses(data.statuses || []);
        setAllTags(data.tags || []);
      } catch (error) {
        toast.error("Failed to load filter options");
      } finally {
        setFiltersLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // Update price range from backend
  useEffect(() => {
    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      sliderPrice[0] === 0 &&
      sliderPrice[1] === 25000
    ) {
      setSliderPrice([minPrice, maxPrice]);
      setFilterPrice([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice]);

  // Debounce price filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterPrice(sliderPrice);
    }, 500);

    return () => clearTimeout(handler);
  }, [sliderPrice]);

  // Fetch products
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }

    dispatch(
      getProduct(
        keyword || "",
        currentPage + 1,
        filterPrice,
        category,
        ratings,
        pageSize,
        brand,
        status,
        tags
      )
    );
  }, [
    dispatch,
    keyword,
    currentPage,
    filterPrice,
    category,
    ratings,
    error,
    pageSize,
    brand,
    status,
    tags,
  ]);

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const priceHandler = (event, newPrice) => {
    setSliderPrice(newPrice);
  };

  const resetFilters = () => {
    setSliderPrice([minPrice || 0, maxPrice || 25000]);
    setFilterPrice([minPrice || 0, maxPrice || 25000]);
    setCategory("");
    setRatings(0);
    setBrand("");
    setStatus("");
    setTags("");
    setCurrentPage(0);
  };

  const count = filteredProductsCount;

  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <Fragment>
          <MetaData title="PRODUCTS -- ECOMMERCE" />
          <h2 className="productsHeading">Products</h2>

          <div className="filterToggleMobile">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mobileFilterButton"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          <div className="productsPage">
            {(window.innerWidth >= 768 || showFilters) && (
              <div className="filterBox">
                {/* Price Filter */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Price</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Slider
                      value={sliderPrice}
                      onChange={priceHandler}
                      valueLabelDisplay="auto"
                      min={minPrice || 0}
                      max={maxPrice || 25000}
                    />
                  </AccordionDetails>
                </Accordion>

                {/* Category Filter */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Categories</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ul className="categoryBox">
                      {categories.map((cat) => (
                        <li
                          key={cat}
                          className="category-link"
                          onClick={() => {
                            setCategory(cat);
                            setCurrentPage(0);
                          }}
                          style={{
                            fontWeight: category === cat ? "bold" : "normal",
                            cursor: "pointer",
                          }}
                        >
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </AccordionDetails>
                </Accordion>

                {/* Brand Filter */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Brands</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {filtersLoading ? (
                      <p>Loading...</p>
                    ) : (
                      <ul className="categoryBox">
                        {allBrands.map((b) => (
                          <li
                            key={b}
                            className="category-link"
                            onClick={() => {
                              setBrand(b);
                              setCurrentPage(0);
                            }}
                            style={{
                              fontWeight: brand === b ? "bold" : "normal",
                              cursor: "pointer",
                            }}
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Status Filter */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Status</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {filtersLoading ? (
                      <p>Loading...</p>
                    ) : (
                      <ul className="categoryBox">
                        {allStatuses.map((s) => (
                          <li
                            key={s}
                            className="category-link"
                            onClick={() => {
                              setStatus(s);
                              setCurrentPage(0);
                            }}
                            style={{
                              fontWeight: status === s ? "bold" : "normal",
                              cursor: "pointer",
                            }}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Tags Filter */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Tags</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {filtersLoading ? (
                      <p>Loading...</p>
                    ) : (
                      <ul className="categoryBox">
                        {allTags.map((tag) => (
                          <li
                            key={tag}
                            className="category-link"
                            onClick={() => {
                              setTags(tag);
                              setCurrentPage(0);
                            }}
                            style={{
                              fontWeight: tags === tag ? "bold" : "normal",
                              cursor: "pointer",
                            }}
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Ratings Filter */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Ratings Above</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Slider
                      value={ratings}
                      onChange={(e, newRating) => {
                        setRatings(newRating);
                        setCurrentPage(0);
                      }}
                      valueLabelDisplay="auto"
                      min={0}
                      max={5}
                    />
                  </AccordionDetails>
                </Accordion>

                {/* Reset Filters */}
                <button onClick={resetFilters} className="resetButton">
                  Reset Filters
                </button>
              </div>
            )}

            {/* Product Display Section */}
            <div className="productsSection">
              <Typography variant="subtitle2" style={{ textAlign: "center", marginBottom: "1rem" }}>
                Showing {filteredProductsCount} of {productsCount} products
              </Typography>

              <div className="pageSizeBox">
                <label htmlFor="pageSizeSelect">Show:</label>
                <select
                  id="pageSizeSelect"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(0);
                  }}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span>per page</span>
              </div>

              <div className="products">
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))
                ) : (
                  <Typography variant="subtitle1" style={{ textAlign: "center", marginTop: "2rem" }}>
                    No products found for selected filters.
                  </Typography>
                )}
              </div>

              {pageSize < count && (
                <div className="paginationBox">
                  <ReactPaginate
                    previousLabel={"Prev"}
                    nextLabel={"Next"}
                    breakLabel={"..."}
                    pageCount={Math.ceil(count / pageSize)}
                    onPageChange={handlePageClick}
                    containerClassName={"pagination"}
                    activeClassName={"active"}
                    forcePage={currentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default Products;