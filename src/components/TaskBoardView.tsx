import React, { useEffect, useState } from "react";
import { db, auth } from "../Auth/firebase.tsx";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/TaskBoardView.css"; 
import Navbar from "./Navbar.tsx";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
}

// 🔥 Function to normalize Firestore status values
const normalizeStatus = (status: string): "Todo" | "In-Progress" | "Completed" => {
  const statusMap: Record<string, "Todo" | "In-Progress" | "Completed"> = {
    "To Do": "Todo",
    "In Progress": "In-Progress",
    "Done": "Completed",
  };
  return statusMap[status] || "Todo";
};

const TaskBoardView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.warn("User not authenticated");
        return;
      }

      console.log("Fetching tasks for user:", user.uid);
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn("No tasks found for this user.");
      }

      const tasksData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          status: normalizeStatus(data.status), // 🔥 Normalize status
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate().toLocaleDateString() : "No Due Date", // ✅ Convert Firestore Timestamp
        };
      });

      setTasks(tasksData);
    };

    fetchTasks();
  }, []);

  const renderTaskColumn = (status: "Todo" | "In-Progress" | "Completed", label: string, color: string) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    return (
      <div className="task-column">
        <div className={`task-column-header ${color}`}>
          {label}
        </div>
        <div className="task-column-content">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task.id} className="task-card">
                <h5>{task.title}</h5>
                <p>{task.description}</p>
                <span>Category: {task.category}</span> | <span>Due: {task.dueDate}</span>
              </div>
            ))
          ) : (
            <p>No Tasks in {label}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="task-board-view">
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
        <div className="right-side">
          <input type="text" placeholder="Search " className="search-input" />
          <button className="add-task-btn">Add Task</button>
        </div>
      </div>
      <div className="task-board">
        {renderTaskColumn("Todo", "TO-DO", "pink")}
        {renderTaskColumn("In-Progress", "IN-PROGRESS", "blue")}
        {renderTaskColumn("Completed", "COMPLETED", "green")}
      </div>
    </div>
  );
};

export default TaskBoardView;

