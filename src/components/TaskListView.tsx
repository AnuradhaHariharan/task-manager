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
} from "firebase/firestore";
import { FaChevronDown, FaChevronUp, FaGripVertical } from "react-icons/fa";
import "../styles/TaskListView.css";
import TaskForm from "./TaskForm.tsx";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
}

const normalizeStatus = (
  status: string
): "Todo" | "In-Progress" | "Completed" => {
  const statusMap: Record<string, "Todo" | "In-Progress" | "Completed"> = {
    "To Do": "Todo",
    "In Progress": "In-Progress",
    Done: "Completed",
  };
  return statusMap[status] || "Todo";
};

const TaskCard = ({
  task,
  updateTaskStatus,
  deleteTask,
  toggleTaskSelection,
  selectedTasks,
}: {
  task: Task;
  updateTaskStatus: (
    taskId: string,
    newStatus: "Todo" | "In-Progress" | "Completed"
  ) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectedTasks: string[];
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });
  const [isOpen, setIsOpen] = useState(false);

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
        >
          {task.title}
        </span>
      </div>
      <div>
        <span>{task.dueDate}</span>
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
              <button className="dropdown-item">✏️ Edit</button>
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState({
    Todo: true,
    "In-Progress": true,
    Completed: true,
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

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
          status: normalizeStatus(data.status),
          dueDate: data.dueDate?.toDate
            ? data.dueDate.toDate().toLocaleDateString()
            : "No Due Date",
        };
      });

      setTasks(tasksData);
    };

    fetchTasks();
  }, []);

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "Todo" | "In-Progress" | "Completed"
  ) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { status: newStatus });
  
      // Update UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
  
      setOpenDropdown(null); // Close dropdown after updating
    } catch (error) {
      console.error("Error updating task status:", error);
    }
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
                    />
                  ))
                ) : (
                  <p>No Tasks in {status}</p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  };

  return (
    <>
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
      onClick={() => selectedTasks.forEach((taskId) => updateTaskStatus(taskId, "Todo"))}
    >
      Todo
    </button>
    <button
      className="dropdown-item"
      onClick={() => selectedTasks.forEach((taskId) => updateTaskStatus(taskId, "In-Progress"))}
    >
      In-Progress
    </button>
    <button
      className="dropdown-item"
      onClick={() => selectedTasks.forEach((taskId) => updateTaskStatus(taskId, "Completed"))}
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
