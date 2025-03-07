import React, { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db, auth } from "../Auth/firebase.tsx";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { FaChevronDown, FaChevronUp, FaGripVertical } from "react-icons/fa";
import "../styles/TaskListView.css";
import TaskForm from "./TaskForm.tsx";
import TaskModal from "./TaskModal.tsx";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
}

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

const TaskCard = ({
  task,
  updateTaskStatus,
  deleteTask,
  toggleTaskSelection,
  selectedTasks,
  handleTaskClick
}: {
  task: Task;
  updateTaskStatus: (
    taskId: string,
    newStatus: "Todo" | "In-Progress" | "Completed"
  ) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectedTasks: string[];handleTaskClick:(task:Task)=>void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });
  const [isOpen, setIsOpen] = useState(false);
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
    <div ref={setNodeRef} className="task-card">
      {/*  Checkbox to mark task as completed */}
      <div className="input-drag">
        <input
          type="checkbox"
          className="completed-checkbox"
          checked={selectedTasks.includes(task.id)}
          onChange={() => toggleTaskSelection(task.id)}
        />
        <FaGripVertical
          className="drag-handle"
          {...attributes}
          {...listeners}
        />
        <span
          className={`task-tick ${
            task.status === "Completed" ? "green-tick" : "grey-tick"
          }`}
        >
          &#10003;
        </span>
      </div>
      <div>
        <span
          className={`task-text ${
            task.status === "Completed" ? "completed-task" : ""
          }`}
          onClick={() => handleTaskClick(task)}
        >
          {task.title}
        </span>
      </div>
      <div>
      <span>{formatDueDate(task.dueDate)}</span>
      </div>
      <div>
        <span className="task-status">{task.status}</span>
      </div>
      <div className="category-container">
        <span>{task.category}</span>
        <div className="task-options">
          <span className="edit-delete" onClick={() => setIsOpen(!isOpen)}>
            ...
          </span>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item"  onClick={() => handleTaskClick(task)}>✏️ Edit</button>
              <button
                className="dropdown-item"
                onClick={() => deleteTask(task.id)}
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskListView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]); 
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    Todo: true,
    "In-Progress": true,
    Completed: true,
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDueDate, setSelectedDueDate] = useState<string>("All");
  const [searchText,setSearchText]=useState<string>("");
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
        };
      });
     setAllTasks(tasksData)  
   
    });
  
    return () => unsubscribe(); // Cleanup listener when component unmounts
  }, []);
  
  useEffect(() => {
    if (allTasks.length !== tasks.length) {
      setTasks(allTasks);
    }
  }, [allTasks]);

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "Todo" | "In-Progress" | "Completed"
  ) => {
    try {
      const statusMap = {
        Todo: "To Do",
        "In-Progress": "In Progress",
        Completed: "Done",
      };
      const formattedStatus = statusMap[newStatus];

      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { status: formattedStatus });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      setOpenDropdown(null);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

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
  

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    const updatedTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(updatedTasks);
  };
  const deleteSelectedTasks = async () => {
    try {
      // Delete from Firestore
      const deletePromises = selectedTasks.map((taskId) =>
        deleteDoc(doc(db, "tasks", taskId))
      );
      await Promise.all(deletePromises);

      // Update UI
      setTasks((prevTasks) =>
        prevTasks.filter((task) => !selectedTasks.includes(task.id))
      );
      setSelectedTasks([]); // Clear selection after deletion
    } catch (error) {
      console.error("Error deleting tasks:", error);
    }
  };

  const renderTaskSection = (
    status: "Todo" | "In-Progress" | "Completed",
    color: string
  ) => {
    const filteredTasks = tasks.filter((task) => task.status === status);

    const deleteTask = async (taskId: string) => {
      try {
        await deleteDoc(doc(db, "tasks", taskId)); // Deletes task from Firestore
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId)); // Updates state
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    };
    const toggleTaskSelection = (taskId: string) => {
      setSelectedTasks(
        (prevSelected) =>
          prevSelected.includes(taskId)
            ? prevSelected.filter((id) => id !== taskId) // Remove if already selected
            : [...prevSelected, taskId] // Add if not selected
      );
    };
    const handleSaveTask = async (updatedTask: Task) => {
      try {
        const taskRef = doc(db, "tasks", updatedTask.id);
        await updateDoc(taskRef, updatedTask);
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
    // Function to delete selected tasks

    return (
      <div className="task-section">
        <div
          className={`task-header ${color}`}
          onClick={() =>
            setOpenSections((prev) => ({ ...prev, [status]: !prev[status] }))
          }
        >
          <strong>
            {status} ({filteredTasks.length})
          </strong>
          {openSections[status] ? (
            <FaChevronUp className="chevron-icon" />
          ) : (
            <FaChevronDown className="chevron-icon" />
          )}
        </div>
        {openSections[status] && (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={filteredTasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="task-content">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}  
                      updateTaskStatus={updateTaskStatus}
                      deleteTask={deleteTask}
                      toggleTaskSelection={toggleTaskSelection}
                      selectedTasks={selectedTasks}
                      handleTaskClick={handleTaskClick}
                    />
                  ))
                ) : (
                  <p>No Tasks in {status}</p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
       {isModalOpen && selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} createdAt={selectedTask.createdAt}/>
      )}
      </div>
    );
  };

  return (
    <>
      <div className="filter-container">
        <div className="left-side">
          <p>Filter by:</p>
          <select className="filter-dropdown" value={taskStatus} onChange={handleCategoryChange}>
            <option value="Category">Category</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>
          <select className="filter-dropdown" value={selectedDueDate} onChange={handleDateChangeFilter}>
            <option value="">Due Date</option>
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
          </select>
        </div>
        <div className="right-side">
          <input type="text" placeholder="Search " className="search-input"  value={searchText} onChange={handleSearchFilter}/>
          <TaskForm />
        </div>
      </div>
      <div className="headings">
        <p>Task name</p>
        <p>Due on</p>
        <p>Task status</p>
        <p>Task Category</p>
      </div>
      <div className="task-list-view">
        {["Todo", "In-Progress", "Completed"].map((status) => {
          const selectedInSection = tasks.filter(
            (task) => selectedTasks.includes(task.id) && task.status === status
          );

          return (
            <div key={status}>
              {renderTaskSection(
                status as "Todo" | "In-Progress" | "Completed",
                status === "Todo"
                  ? "pink"
                  : status === "In-Progress"
                  ? "blue"
                  : "green"
              )}

              {selectedInSection.length > 0 && (
                <div className="selectedtasks-manipulate-container">
                  <div className="selectedtasks-manipulate">
                    <div className="selected-tasks">
                      {selectedInSection.length} tasks selected
                    </div>
                    <button
                      className="change-status-btn"
                      onClick={() =>
                        setOpenDropdown(openDropdown === status ? null : status)
                      }
                    >
                      Status
                    </button>
                    <button
                      className="delete-btn"
                      onClick={deleteSelectedTasks}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              {openDropdown === status && (
                <div className="dropdown-menu-status">
                  <button
                    className="dropdown-item"
                    onClick={() =>
                      selectedTasks.forEach((taskId) =>
                        updateTaskStatus(taskId, "Todo")
                      )
                    }
                  >
                    Todo
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() =>
                      selectedTasks.forEach((taskId) =>
                        updateTaskStatus(taskId, "In-Progress")
                      )
                    }
                  >
                    In-Progress
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() =>
                      selectedTasks.forEach((taskId) =>
                        updateTaskStatus(taskId, "Completed")
                      )
                    }
                  >
                    Completed
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TaskListView;
