import React, { useEffect, useState } from "react";
import { db, auth } from "../Auth/firebase.tsx";
import { collection, query, where, getDocs,onSnapshot } from "firebase/firestore";
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
  const [allTasks, setAllTasks] = useState<TaskType[]>([]); 
  const [taskStatus, setTaskStatus] = useState<string>("");


  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.warn("User not authenticated");
      return;
    }
  
    console.log("Listening for task updates for user:", user.uid);
    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
  
    // 🔥 Firestore real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
          status: normalizeStatus(data.status),
          dueDate: data.dueDate?.toDate
            ? data.dueDate.toDate().toLocaleDateString()
            : "No Due Date",
        };
      });
     setAllTasks(tasksData)  
    });
  
    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);
  useEffect(() => {
    setTasks(allTasks);
  }, [allTasks]);

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = event.target.value;
    console.log(selectedCategory);
    setTaskStatus(selectedCategory);
  
    if (selectedCategory === "" ||selectedCategory==="Category") {
      // If no category is selected, show all tasks
      setTasks(allTasks);
    } else {
      // Filter tasks based on category
      const filteredTasks = allTasks.filter(
        (task) => task.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      setTasks(filteredTasks);
    }
  };

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
              <div key={task.id} className="task-card-b">
                <span>{task.title}</span>
                <div className="task-date">
                <span>{task.category}</span> 
                <span>{task.dueDate}</span>
                </div>
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
          <select className="filter-dropdown" value={taskStatus} onChange={handleCategoryChange}>
            <option value="Category">Category</option>
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

