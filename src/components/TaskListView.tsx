import React, { useEffect, useState } from "react";
import { db, auth } from "../Auth/firebase.tsx";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaSignOutAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/TaskListView.css"; // Add styles
import Navbar from "./Navbar.tsx";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
}

const TaskListView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    Todo: true,
    "In-Progress": true,
    Completed: true,
  });

  useEffect(() => {
    const fetchTasks = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];

      setTasks(tasksData);
    };

    fetchTasks();
  }, []);

  const toggleSection = (section: "Todo" | "In-Progress" | "Completed") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderTaskSection = (
    status: "Todo" | "In-Progress" | "Completed",
    color: string
  ) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    return (
      <div className="task-section">
        <div
          className={`task-header ${color}`}
          onClick={() => toggleSection(status)}
        >
          <strong>
            {status} ({filteredTasks.length})
          </strong>
          {openSections[status] ? <FaChevronUp /> : <FaChevronDown />}
        </div>
        {openSections[status] && (
          <div className="task-content">
            {status === "Todo" && (
              <button className="add-task-btn">Add Task</button>
            )}
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="task-card">
                  <h5>{task.title}</h5>
                  <p>{task.description}</p>
                  <span>Category: {task.category}</span> |{" "}
                  <span>Due: {task.dueDate}</span>
                </div>
              ))
            ) : (
              <p>No Tasks in {status}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="task-list-view">
      <div className="filter-container">
        <div className="left-side">
          <p>Filter by:</p>
          <select className="filter-dropdown">
            <option value="">Category</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>

          <select className="filter-dropdown">
            <option value="">Due Date</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>
        </div>
      </div>
      <div className="headings">
        <p>Task name</p>
        <p>Due on</p>
        <p>Task status</p>
        <p>Task Category</p>
      </div>
      {/* Task Sections */}
      {renderTaskSection("Todo", "pink")}
      {renderTaskSection("In-Progress", "blue")}
      {renderTaskSection("Completed", "green")}
    </div>
  );
};

export default TaskListView;
