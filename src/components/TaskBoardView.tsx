import React, { useEffect, useState } from "react";
import { db, auth } from "../Auth/firebase.tsx";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/TaskBoardView.css"; // Add styles
import Navbar from "./Navbar.tsx";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
}

const TaskBoardView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
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
      <div className="task-board">
        {renderTaskColumn("Todo", "TO-DO", "pink")}
        {renderTaskColumn("In-Progress", "IN-PROGRESS", "blue")}
        {renderTaskColumn("Completed", "COMPLETED", "green")}
      </div>
    </div>
  );
};

export default TaskBoardView;
