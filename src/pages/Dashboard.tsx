import React, { useState } from "react";
import TaskListView from "../components/TaskListView.tsx";
import TaskBoardView from "../components/TaskBoardView.tsx";
import TaskForm from "../components/TaskForm.tsx";
import "../styles/Dashboard.css";
import Navbar from "../components/Navbar.tsx";

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<"list" | "board">("list"); // Default List View

  return (
    <div className="dashboard">
      <Navbar viewMode={viewMode} setViewMode={setViewMode} />
      {viewMode === "list" ? <TaskListView /> : <TaskBoardView />}
    </div>
  );
};

export default Dashboard;

