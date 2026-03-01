import { Routes, Route, Link } from "react-router-dom";
import OrdersListPage from "./pages/OrdersListPage";
import OrderDetailPage from "./pages/OrderDetailPage";

export default function App() {
  return (
    <>
      <header>
        <h1>📡 Order Radar</h1>
        <nav>
          <Link to="/">Orders</Link>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<OrdersListPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </main>
    </>
  );
}
