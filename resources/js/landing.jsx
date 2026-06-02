import { createRoot } from "react-dom/client";
import "../css/app.css";
import LandingApp from "./landing/App";

createRoot(document.getElementById("app")).render(<LandingApp />);
