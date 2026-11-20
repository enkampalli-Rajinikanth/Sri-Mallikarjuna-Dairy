import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

import {
  Milk,
  Menu,
  X,
  Phone,
  MapPin,
  ShieldCheck,
  Truck,
  Heart,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LogOut,
  Trash2,
  PackageCheck,
  Plus,
  RotateCcw,
} from "lucide-react";

import { dairy } from "./data";
import heroImage from "./assets/dairy-hero.png";
import DairyChatbot from "./components/DairyChatbot";

const API = "http://localhost:8085/api";

// Fetch ALL products, including unavailable products
function useAvailableProducts() {
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState("");

  async function fetchProducts() {
    try {
      setProductLoading(true);
      setProductError("");

      // Correct endpoint: GET /api/products
      const response = await fetch(`${API}/products`);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected product response.");
      }

      setProducts(data);
    } catch (error) {
      console.error("Product loading error:", error);
      setProductError(error.message);
    } finally {
      setProductLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();

    const handleProductUpdate = () => fetchProducts();

    window.addEventListener("products-updated", handleProductUpdate);

    return () => {
      window.removeEventListener("products-updated", handleProductUpdate);
    };
  }, []);

  return { products, productLoading, productError };
}

// Header
function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    ["Home", "/"],
    ["About", "/about"],
    ["Products", "/products"],
    ["My Orders", "/my-orders"],
    ["Contact", "/contact"],
    ["Admin", "/admin"],
  ];

  return (
    <header className="header">
      <Link to="/" className="brand" onClick={() => setOpen(false)}>
        <span className="brand-mark">
          <Milk size={31} />
        </span>

        <span>
          <strong>
            SRI MALLIKARJUNA
            <br />
            DAIRY
          </strong>
          <small>Freshness You Trust, Quality You Deserve.</small>
        </span>
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X /> : <Menu />}
      </button>

      <nav className={open ? "nav open" : "nav"}>
        {links.map(([label, path]) => (
          <Link
            key={path}
            className={location.pathname === path ? "active" : ""}
            to={path}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
      </nav>

      <a className="phone-link" href={`tel:${dairy.phone}`}>
        <Phone size={18} /> +91 {dairy.phone}
      </a>

      <Link className="button header-book" to="/booking">
        <CalendarDays size={18} /> Book Milk
      </Link>
    </header>
  );
}

// Footer
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <strong>Sri Mallikarjuna Dairy</strong>
          <p>Freshness you trust, quality you deserve.</p>
        </div>

        <div>
          <p>
            <Phone size={16} />{" "}
            <a href={`tel:${dairy.phone}`}>+91 {dairy.phone}</a>
          </p>

          <p>
            <MapPin size={16} /> {dairy.address}
          </p>
        </div>

        <div className="copyright">
          © {new Date().getFullYear()} Sri Mallikarjuna Dairy
        </div>
      </div>
    </footer>
  );
}

// Product card
function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-icon">
        <Milk size={46} />
      </div>

      <div className="product-info">
        <span className="eyebrow">FRESH DAILY</span>

        <h3>{product.name}</h3>

        {product.description && <p>{product.description}</p>}

        <strong className="price">
          ₹{product.price} <small>/ {product.unit}</small>
        </strong>

        {product.available ? (
          <p className="success-message">Available</p>
        ) : (
          <p className="error-message">Currently Unavailable</p>
        )}
      </div>
    </article>
  );
}

// Booking form
function BookingForm({ products, productLoading, productError }) {
  const availableProducts = products.filter(
    (product) => product.available === true,
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    area: "Kamareddy",
    product: "",
    quantity: "1",
    delivery: "Daily",
    note: "",
  });

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Automatically select the first AVAILABLE product
  useEffect(() => {
    const selectedIsAvailable = availableProducts.some(
      (product) => String(product.id) === String(form.product),
    );

    if (!selectedIsAvailable) {
      setForm((previous) => ({
        ...previous,
        product: String(availableProducts[0]?.id || ""),
      }));
    }
  }, [products, form.product]);

  const selected = availableProducts.find(
    (product) => String(product.id) === String(form.product),
  );

  const total = selected ? selected.price * Number(form.quantity || 0) : 0;

  const update = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  async function submit(e) {
    e.preventDefault();

    if (!selected || !selected.available) {
      setMessage("Please select an available product.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      setMessage("Please enter a valid quantity.");
      return;
    }

    const bookingData = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      area: form.area,
      productId: Number(form.product),
      quantity: Number(form.quantity),
      deliveryType: form.delivery,
      notes: form.note,
    };

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      setMessage("Booking successful! Booking ID: " + result.id);

      setForm({
        name: "",
        phone: "",
        address: "",
        area: "Kamareddy",
        product: String(availableProducts[0]?.id || ""),
        quantity: "1",
        delivery: "Daily",
        note: "",
      });
    } catch (error) {
      console.error(error);
      setMessage("Booking failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={submit}>
      <div className="form-title">
        <CalendarDays />
        <h2>Book Your Daily Dairy Products</h2>
      </div>

      {productLoading && <p>Loading products...</p>}

      {productError && (
        <p className="error-message">Could not load products: {productError}</p>
      )}

      {!productLoading && availableProducts.length === 0 && (
        <p className="error-message">
          No products are currently available for booking.
        </p>
      )}

      <div className="form-grid">
        <label>
          Your Name
          <input
            name="name"
            value={form.name}
            onChange={update}
            placeholder="Enter your name"
            required
          />
        </label>

        <label>
          Mobile Number
          <input
            name="phone"
            value={form.phone}
            onChange={update}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength="10"
            required
          />
        </label>

        <label className="full">
          Delivery Address
          <input
            name="address"
            value={form.address}
            onChange={update}
            placeholder="House number, street / landmark"
            required
          />
        </label>

        <label>
          Delivery Area
          <select name="area" value={form.area} onChange={update}>
            {dairy.areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label>
          Product
          <select
            name="product"
            value={form.product}
            onChange={update}
            required
            disabled={availableProducts.length === 0 || productLoading}
          >
            <option value="">Select a product</option>

            {products.map((product) => (
              <option
                key={product.id}
                value={String(product.id)}
                disabled={!product.available}
              >
                {product.name} — ₹{product.price}/{product.unit}
                {!product.available ? " (Unavailable)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Quantity ({selected?.unit || "unit"})
          <input
            name="quantity"
            type="number"
            min="1"
            max="50"
            step="1"
            value={form.quantity}
            onChange={update}
            required
            disabled={!selected}
          />
        </label>

        <label>
          Delivery Type
          <select name="delivery" value={form.delivery} onChange={update}>
            <option>Daily</option>
            <option>One-time</option>
          </select>
        </label>

        <label className="full">
          Additional Note (optional)
          <textarea
            name="note"
            value={form.note}
            onChange={update}
            placeholder="Any delivery instructions?"
            rows="2"
          />
        </label>
      </div>

      <div className="total-row">
        <span>Estimated total per delivery</span>
        <strong>₹{Number.isFinite(total) ? total : 0}</strong>
      </div>

      <p className="payment-note">
        Payment: Cash / offline payment. No online payment required.
      </p>

      <button
        className="button submit-button"
        type="submit"
        disabled={
          submitting ||
          productLoading ||
          !selected ||
          availableProducts.length === 0
        }
      >
        <CheckCircle2 size={19} />
        {submitting ? "Submitting..." : "Confirm Booking"}
      </button>

      {message && (
        <p
          className={
            message.startsWith("Booking successful")
              ? "success-message"
              : "error-message"
          }
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}

// Home page
function Home({ products, productLoading, productError }) {
  return (
    <>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.94) 0%, rgba(255,255,255,.78) 42%, rgba(255,255,255,.03) 72%), url("${heroImage}")`,
        }}
      >
        <div className="hero-content">
          <span className="eyebrow">PURE • FRESH • LOCAL</span>

          <h1>
            Fresh Buffalo Milk
            <br /> & Curd Delivered
            <br /> to Your Doorstep!
          </h1>

          <p>Freshness You Trust, Quality You Deserve.</p>

          <Link className="button" to="/booking">
            <CalendarDays size={19} /> Book Now <span>→</span>
          </Link>
        </div>
      </section>

      <section className="benefits">
        <div>
          <ShieldCheck />
          <span>
            Pure & Fresh
            <br />
            Dairy Products
          </span>
        </div>

        <div>
          <Truck />
          <span>
            Daily Home
            <br />
            Delivery
          </span>
        </div>

        <div>
          <Heart />
          <span>
            Hygienic &
            <br />
            Healthy
          </span>
        </div>

        <div>
          <PackageCheck />
          <span>
            Trusted in
            <br />
            Kamareddy
          </span>
        </div>
      </section>

      <main className="home-content">
        <section className="about-preview">
          <span className="eyebrow">WELCOME TO OUR DAIRY</span>
          <h2>Freshness in Every Drop</h2>

          <p>
            Sri Mallikarjuna Dairy is committed to providing fresh buffalo milk
            and curd to families in Kamareddy. We focus on quality, hygiene and
            dependable home delivery.
          </p>

          <Link className="text-link" to="/about">
            Know More →
          </Link>
        </section>

        <section className="products-preview">
          <span className="eyebrow">OUR PRODUCTS</span>
          <h2>Choose Your Favourite</h2>

          {productLoading && <p>Loading products...</p>}

          {productError && (
            <p className="error-message">
              Unable to load products: {productError}
            </p>
          )}

          {!productLoading && products.length === 0 && (
            <p>No products found.</p>
          )}

          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>

        <BookingForm
          products={products}
          productLoading={productLoading}
          productError={productError}
        />
      </main>
    </>
  );
}

// Page banner
function PageBanner({ eyebrow, title, desc }) {
  return (
    <div className="page-banner">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{desc}</p>
    </div>
  );
}

// About page
function About() {
  return (
    <>
      <PageBanner
        eyebrow="OUR STORY"
        title="About Our Dairy"
        desc="Fresh dairy products and reliable delivery for our Kamareddy community."
      />

      <section className="simple-page">
        <h2>Quality You Can Trust</h2>

        <p>
          Sri Mallikarjuna Dairy is based in {dairy.address}. We aim to make
          fresh buffalo milk and curd easily available to local households with
          convenient booking and dependable delivery.
        </p>

        <div className="info-strip">
          <MapPin /> Serving {dairy.areas.join(", ")}
          <span>•</span>
          <Phone /> +91 {dairy.phone}
        </div>

        <Link className="button" to="/booking">
          Book Your Order
        </Link>
      </section>
    </>
  );
}

// Products page: show ALL products
function Products({ products, productLoading, productError }) {
  return (
    <>
      <PageBanner
        eyebrow="FRESH FROM OUR DAIRY"
        title="Our Products"
        desc="Explore all our dairy products and check their current availability."
      />

      <section className="product-list">
        {productLoading && <p>Loading products...</p>}

        {productError && (
          <p className="error-message">
            Unable to load products: {productError}
          </p>
        )}

        {!productLoading && products.length === 0 && <p>No products found.</p>}

        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      <div className="center-action">
        <Link className="button" to="/booking">
          Book Products
        </Link>
      </div>
    </>
  );
}

// Booking page
function Booking({ products, productLoading, productError }) {
  return (
    <>
      <PageBanner
        eyebrow="EASY HOME DELIVERY"
        title="Book Your Dairy Products"
        desc="Choose an available product, select quantity and submit your delivery details."
      />

      <div className="booking-page">
        <BookingForm
          products={products}
          productLoading={productLoading}
          productError={productError}
        />
      </div>
    </>
  );
}

// My orders page
function MyOrders() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);
    setOrders([]);

    try {
      const response = await fetch(`${API}/bookings/customer/${phone}`);

      if (!response.ok) {
        throw new Error("Unable to fetch orders");
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deliveredOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "delivered",
  ).length;

  const pendingOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "new",
  ).length;

  return (
    <>
      <PageBanner
        eyebrow="ORDER TRACKING"
        title="My Orders"
        desc="Enter your registered mobile number to view your order history."
      />

      <section className="simple-page order-lookup">
        <form onSubmit={handleSearch}>
          <label>
            Mobile Number
            <input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSearched(false);
                setError("");
              }}
              placeholder="Enter your 10-digit number"
              maxLength="10"
              required
            />
          </label>

          <button className="button" disabled={loading}>
            {loading ? "Searching..." : "Find Orders"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {searched && !loading && !error && (
          <>
            <div className="order-summary">
              <h2>Total Orders: {orders.length}</h2>
              <h3>Delivered: {deliveredOrders}</h3>
              <h3>Pending: {pendingOrders}</h3>
            </div>

            {orders.length > 0 ? (
              orders.map((o) => (
                <article className="order-card" key={o.id}>
                  <div>
                    <strong>
                      {o.product?.name || "Product"} × {o.quantity}
                    </strong>

                    <small>Booking ID: {o.id}</small>

                    <small>
                      {o.customer?.address}, {o.customer?.area}
                    </small>

                    <small>
                      Ordered on:{" "}
                      {o.bookingDate
                        ? new Date(o.bookingDate).toLocaleString("en-IN")
                        : ""}
                    </small>
                  </div>

                  <div className="order-meta">
                    <b>₹{o.totalAmount}</b>
                    <span className="status">{o.status}</span>
                  </div>
                </article>
              ))
            ) : (
              <p>No orders found for this mobile number.</p>
            )}
          </>
        )}
      </section>
    </>
  );
}

// Contact page
function Contact() {
  return (
    <>
      <PageBanner
        eyebrow="GET IN TOUCH"
        title="Contact Us"
        desc="Have a question or want to arrange your daily delivery? Contact our dairy."
      />

      <section className="contact-grid">
        <article>
          <Phone />
          <h3>Call Us</h3>
          <a href={`tel:${dairy.phone}`}>+91 {dairy.phone}</a>
        </article>

        <article>
          <MapPin />
          <h3>Our Address</h3>
          <p>{dairy.address}</p>
        </article>

        <article>
          <Truck />
          <h3>Delivery Area</h3>
          <p>Kamareddy</p>
        </article>
      </section>
    </>
  );
}

// Admin page
function Admin() {
  const [orders, setOrders] = useState([]);

  const [authed, setAuthed] = useState(
    sessionStorage.getItem("dairyAdmin") === "yes",
  );

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Product management state
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    unit: "litre",
  });

  // Fetch bookings
  useEffect(() => {
    if (!authed) return;

    let ignore = false;

    async function fetchBookings() {
      setLoading(true);
      setAdminError("");

      try {
        const response = await fetch(`${API}/bookings`);

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Unexpected booking response from backend.");
        }

        if (!ignore) {
          setOrders(data);
        }
      } catch (err) {
        if (!ignore) {
          setAdminError("Could not load bookings: " + err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchBookings();

    return () => {
      ignore = true;
    };
  }, [authed]);

  // Fetch all products, including unavailable products
  async function fetchProducts() {
    try {
      setProductLoading(true);
      setProductError("");

      const response = await fetch(`${API}/products`);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected product response from backend.");
      }

      setProducts(data);
    } catch (err) {
      console.error("Product fetch error:", err);
      setProductError("Could not load products: " + err.message);
    } finally {
      setProductLoading(false);
    }
  }

  useEffect(() => {
    if (authed) {
      fetchProducts();
    }
  }, [authed]);

  // Admin login
  function login(e) {
    e.preventDefault();

    if (user === "admin" && pass === "Dairy@123") {
      sessionStorage.setItem("dairyAdmin", "yes");
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect demo login details.");
    }
  }

  // Update booking status
  async function changeStatus(id, status) {
    try {
      setStatusMessage("");

      const response = await fetch(`${API}/bookings/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setOrders((previousOrders) =>
        previousOrders.map((o) => (o.id === id ? { ...o, status } : o)),
      );

      setStatusMessage("Booking status updated successfully.");
    } catch (err) {
      setStatusMessage("Status update failed: " + err.message);
    }
  }

  // Add new product
  async function addProduct(e) {
    e.preventDefault();

    if (!productForm.name.trim()) {
      setProductMessage("Please enter a product name.");
      return;
    }

    if (!productForm.price || Number(productForm.price) <= 0) {
      setProductMessage("Please enter a valid product price.");
      return;
    }

    try {
      setProductMessage("");

      const newProduct = {
        name: productForm.name.trim(),
        price: Number(productForm.price),
        unit: productForm.unit,
        available: true,
      };

      const response = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const savedProduct = await response.json();

      setProducts((previous) => [...previous, savedProduct]);

      setProductForm({
        name: "",
        price: "",
        unit: "litre",
      });

      setProductMessage("Product added successfully!");

      window.dispatchEvent(new Event("products-updated"));
    } catch (err) {
      console.error(err);
      setProductMessage("Product addition failed: " + err.message);
    }
  }

  // Remove product by marking it unavailable
  async function removeProduct(id) {
    const confirmRemove = window.confirm(
      "Are you sure you want to make this product unavailable?",
    );

    if (!confirmRemove) return;

    try {
      setProductMessage("");

      const response = await fetch(`${API}/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setProducts((previous) =>
        previous.map((product) =>
          product.id === id ? { ...product, available: false } : product,
        ),
      );

      setProductMessage("Product is now unavailable.");

      window.dispatchEvent(new Event("products-updated"));
    } catch (err) {
      console.error(err);
      setProductMessage("Product removal failed: " + err.message);
    }
  }

  // Restore unavailable product
  async function restoreProduct(id) {
    try {
      setProductMessage("");

      const response = await fetch(
        `${API}/products/${id}/availability?available=true`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updatedProduct = await response.json();

      setProducts((previous) =>
        previous.map((product) =>
          product.id === id ? updatedProduct : product,
        ),
      );

      setProductMessage("Product restored successfully.");

      window.dispatchEvent(new Event("products-updated"));
    } catch (err) {
      console.error(err);
      setProductMessage("Product restore failed: " + err.message);
    }
  }

  // Logout screen
  if (!authed) {
    return (
      <section className="admin-login">
        <h1>Admin Login</h1>
        <p>Demo dashboard access</p>

        <form onSubmit={login}>
          <label>
            Username
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
          </label>

          <button className="button">Login</button>

          {error && <p className="error-message">{error}</p>}

          <small>Demo: admin / Dairy@123</small>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-area">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">DAIRY MANAGEMENT</span>
          <h1>Admin Dashboard</h1>
        </div>

        <button
          className="button outline"
          onClick={() => {
            sessionStorage.removeItem("dairyAdmin");
            setAuthed(false);
            setOrders([]);
            setProducts([]);
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Booking statistics */}
      <div className="stats">
        <div>
          <ClipboardList />
          <strong>{orders.length}</strong>
          <span>Total bookings</span>
        </div>

        <div>
          <PackageCheck />
          <strong>
            {orders.filter((o) => o.status === "Delivered").length}
          </strong>
          <span>Delivered</span>
        </div>

        <div>
          <CalendarDays />
          <strong>{orders.filter((o) => o.status === "New").length}</strong>
          <span>New bookings</span>
        </div>
      </div>

      {loading && <p className="empty">Loading bookings...</p>}

      {adminError && <p className="error-message">{adminError}</p>}

      {statusMessage && <p className="success-message">{statusMessage}</p>}

      {/* Add product section */}
      <section className="product-management">
        <span className="eyebrow">PRODUCT MANAGEMENT</span>

        <h2>Add New Product</h2>

        <form className="booking-form" onSubmit={addProduct}>
          <div className="form-grid">
            <label>
              Product Name
              <input
                type="text"
                placeholder="Example: Fresh Cow Milk"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    name: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Price
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter price"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    price: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Unit
              <select
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    unit: e.target.value,
                  })
                }
              >
                <option value="litre">Litre</option>
                <option value="kg">Kg</option>
                <option value="piece">Piece</option>
                <option value="packet">Packet</option>
              </select>
            </label>
          </div>

          <button className="button submit-button" type="submit">
            <Plus size={19} /> Add Product
          </button>
        </form>

        {productMessage && (
          <p
            className={
              productMessage.includes("failed") ||
              productMessage.includes("Please")
                ? "error-message"
                : "success-message"
            }
            role="status"
          >
            {productMessage}
          </p>
        )}

        {productError && <p className="error-message">{productError}</p>}

        {/* Manage products table */}
        <div className="inventory-section">
          <span className="eyebrow">PRODUCT INVENTORY</span>

          <h2>Manage Products</h2>

          {productLoading && <p>Loading products...</p>}

          {!productLoading && products.length === 0 && !productError && (
            <p className="empty">No products found.</p>
          )}

          {!productLoading && products.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th>Availability</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>₹{product.price}</td>
                      <td>{product.unit}</td>

                      <td>
                        {product.available ? (
                          <span>Available</span>
                        ) : (
                          <span style={{ color: "red" }}>Unavailable</span>
                        )}
                      </td>

                      <td>
                        {product.available ? (
                          <button
                            type="button"
                            className="button outline"
                            onClick={() => removeProduct(product.id)}
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button outline"
                            onClick={() => restoreProduct(product.id)}
                          >
                            <RotateCcw size={16} />
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Bookings dashboard */}
      <section className="admin-bookings">
        <span className="eyebrow">CUSTOMER ORDERS</span>

        <h2>Bookings Dashboard</h2>

        {!loading && !adminError && orders.length === 0 ? (
          <p className="empty">No bookings found in the database.</p>
        ) : (
          !loading &&
          !adminError && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.id}
                        <small>
                          {o.bookingDate
                            ? new Date(o.bookingDate).toLocaleString("en-IN")
                            : ""}
                        </small>
                      </td>

                      <td>
                        {o.customer?.name}
                        <small>{o.customer?.phone}</small>
                        <small>{o.customer?.address}</small>
                      </td>

                      <td>{o.product?.name}</td>

                      <td>
                        {o.quantity} {o.product?.unit}
                      </td>

                      <td>₹{o.totalAmount}</td>

                      <td>
                        <select
                          value={o.status}
                          onChange={(e) => changeStatus(o.id, e.target.value)}
                        >
                          <option value="New">New</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        <p className="demo-warning">
          Bookings and products are loaded from the Spring Boot backend and
          PostgreSQL database.
        </p>
      </section>
    </section>
  );
}

// Main App
export default function App() {
  const { products, productLoading, productError } = useAvailableProducts();

  return (
    <>
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <Home
              products={products}
              productLoading={productLoading}
              productError={productError}
            />
          }
        />

        <Route path="/about" element={<About />} />

        <Route
          path="/products"
          element={
            <Products
              products={products}
              productLoading={productLoading}
              productError={productError}
            />
          }
        />

        <Route
          path="/booking"
          element={
            <Booking
              products={products}
              productLoading={productLoading}
              productError={productError}
            />
          }
        />

        <Route path="/my-orders" element={<MyOrders />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/admin" element={<Admin />} />
      </Routes>

      <Footer />

      <DairyChatbot />
    </>
  );
}
