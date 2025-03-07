import React, { useEffect, useState } from "react";
import { db, auth } from "../Auth/firebase.tsx";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/TaskBoardView.css";
import Navbar from "./Navbar.tsx";
import TaskModal from "./TaskModal.tsx";
import TaskForm from "./TaskForm.tsx";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
  lastUpdated?: string;
  createdAt: string;
}

// 🔥 Normalize Firestore status values
const normalizeStatus = (status: string): "Todo" | "In-Progress" | "Completed" => {
  const statusMap: Record<string, "Todo" | "In-Progress" | "Completed"> = {
    "To Do": "Todo",
    "In-Progress": "In-Progress",
    Done: "Completed",
    "Completed": "Completed",
  };
  const normalizedStatus = statusMap[status] || "Todo"; // Default to "Todo" if unrecognized
  console.log('Original Status:', status, 'Mapped Status:', normalizedStatus); // Debug log
  return normalizedStatus;
};


const TaskBoardView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDueDate, setSelectedDueDate] = useState<string>("Due Date");
  const [searchText,setSearchText]=useState<string>("");

  console.log(selectedDueDate)
  
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
          dueDate: typeof data.dueDate === "string" ? data.dueDate : "No Due Date",        
          lastUpdated: data.lastUpdated?.toDate 
            ? data.lastUpdated.toDate().toISOString()
            : undefined,
          createdAt: data.createdAt?.toDate 
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
        };
      });
      setAllTasks(tasksData);
    });

    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);

  useEffect(() => {
    setTasks(allTasks);
  }, [allTasks]);
  
  useEffect(() => {
    console.log(tasks);
  }, [tasks]);
  

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCategory = event.target.value;
    setTaskStatus(selectedCategory);

    if (selectedCategory === "" || selectedCategory === "Category") {
      setTasks(allTasks);
    } else {
      const filteredTasks = allTasks.filter(
        (task) => task.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      setTasks(filteredTasks);
    }
  };

  const handleDateChangeFilter = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedDateFilter = event.target.value;
    setSelectedDueDate(selectedDateFilter)
    console.log(selectedDateFilter)
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
  
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of the week
  
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)
  
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month
  
    if (!selectedDateFilter || selectedDateFilter === "Due Date") {
      setTasks(allTasks);
    } else {
      const filteredTasks = allTasks.filter((task) => {
        const [day, month, year] = task.dueDate.split("-").map(Number);
        const taskDate = new Date(year, month - 1, day); // Month is 0-based
  
        switch (selectedDateFilter) {
          case "today":
            return taskDate.toDateString() === today.toDateString();
          case "tomorrow":
            return taskDate.toDateString() === tomorrow.toDateString();
          case "this-week":
            return taskDate >= startOfWeek && taskDate <= endOfWeek;
          case "this-month":
            return taskDate >= startOfMonth && taskDate <= endOfMonth;
          default:
            return true;
        }
      });
  
      setTasks(filteredTasks);
    }
  };
  
  const handleSearchFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchText(searchValue);
    console.log(searchText)
  
    if (searchValue === "") {
      setTasks(allTasks);
    } else {
      const filteredTasks = allTasks.filter((task) =>
        task.title.toLowerCase().includes(searchValue) ||
      task.description.toLowerCase().includes(searchValue)
      );
      setTasks(filteredTasks);
    }
  };
  


  const toggleDropdown = (taskId: string) => {
    setOpenDropdownId((prevId) => (prevId === taskId ? null : taskId));
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      const taskRef = doc(db, "tasks", updatedTask.id);
      await updateDoc(taskRef, {
        title: updatedTask.title,
        description: updatedTask.description,
        category: updatedTask.category,
        status: updatedTask.status,
        dueDate: updatedTask.dueDate,
        lastUpdated: new Date(), // Optional: update the timestamp
      });
      
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? { ...updatedTask } : task
        )
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  

  const renderTaskColumn = (
    status: "Todo" | "In-Progress" | "Completed",
    label: string,
    color: string
  ) => {
    const filteredTasks = tasks.filter((task) => task.status === status);

    const formatDueDate = (dueDate: string) => {
      if (!dueDate) return "Invalid Date"; // Handle missing date
    
      // Parse "DD-MM-YYYY" string to a proper Date object
      const [day, month, year] = dueDate.split("-").map(Number);
      const taskDueDate = new Date(year, month - 1, day); // Month is 0-based in JS Dates
    
      if (isNaN(taskDueDate.getTime())) return "Invalid Date"; // Handle invalid date input
    
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight
      taskDueDate.setHours(0, 0, 0, 0); // Reset time to midnight
    
      const diffInDays = Math.floor((taskDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Tomorrow";
      if (diffInDays < 0) return "❗ Overdue";
    
      return dueDate; // Return in "DD-MM-YYYY" format
    };
    


    return (
      <div className="task-column">
        <div className={`task-column-header ${color}`}>{label}</div>
        <div className="task-column-content">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task.id} className="task-card-b" >
                <div className="task-header-board">
                  <span
                    className="edit-delete"
                    onClick={() => toggleDropdown(task.id)}
                   
                  >
                    ...
                  </span>
                  {openDropdownId === task.id && (
                    <div className="dropdown-menu-board">
                      <button className="dropdown-item"  onClick={() => handleTaskClick(task)}>✏️ Edit</button>
                      <button
                        className="dropdown-item"
                        onClick={() => deleteTask(task.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                  <span onClick={() => handleTaskClick(task)} className="task-title">{task.title}</span>
                </div>
                <div className="task-date">
                  <span>{task.category}</span>
                  <span>{formatDueDate(task.dueDate)}</span>
                </div>
              </div>
            ))
          ) : (
            <p>No Tasks in {label}</p>
          )}
           {isModalOpen && selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} createdAt={selectedTask.createdAt}/>
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
          <select
            className="filter-dropdown"
            value={taskStatus}
            onChange={handleCategoryChange}
          >
            <option value="Category">Category</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>

          <select className="filter-dropdown"
           value={selectedDueDate}
           onChange={handleDateChangeFilter}
           >
            <option value="">Due Date</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>
        </div>
        <div className="right-side">
          <input type="text" placeholder="Search " className="search-input" value={searchText} onChange={handleSearchFilter} />
          <TaskForm />
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

