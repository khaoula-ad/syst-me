import { createBrowserRouter } from "react-router";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CreateBudget from "./components/CreateBudget";
import BudgetDetails from "./components/BudgetDetails";
import BudgetReview from "./components/BudgetReview";
import JustificationUpload from "./components/JustificationUpload";

export const router = createBrowserRouter([
  { path: "/", Component: Login },
  { path: "/dashboard", Component: Dashboard },
  { path: "/budget/new", Component: CreateBudget },
  { path: "/budget/:id", Component: BudgetDetails },
  { path: "/budget/review", Component: BudgetReview },
  { path: "/justification", Component: JustificationUpload },
  { path: "*", Component: Login },
]);
