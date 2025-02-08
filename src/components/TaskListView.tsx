import React, { useEffect, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { db, auth } from "../Auth/firebase.tsx";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
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
const normalizeStatus = (status: string): "Todo" | "In-Progress" | "Completed" => {
  const statusMap: Record<string, "Todo" | "In-Progress" | "Completed"> = {
    "To Do": "Todo",
    "In Progress": "In-Progress",
    "Done": "Completed",
  };
  return statusMap[status] || "Todo";
};


const TaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    userSelect: "none",
    padding: "10px",
    margin: "5px 0",
    backgroundColor: "white",
    borderRadius: "5px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="task-card">
      <FaGripVertical className="drag-handle" />
      <h5>{task.title}</h5>
      <span>{task.dueDate}</span>
      <span>{task.status}</span>
      <span>{task.category}</span>
    </div>
  );
};

const TaskListView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openSections, setOpenSections] = useState({ Todo: true, "In-Progress": true, Completed: true });

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

  const updateTaskStatus = async (taskId: string, newStatus: "Todo" | "In-Progress" | "Completed") => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { status: newStatus });
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      );
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

  const renderTaskSection = (status: "Todo" | "In-Progress" | "Completed", color: string) => {
    const filteredTasks = tasks.filter((task) => task.status === status);
    console.log(`Tasks for ${status}:`, filteredTasks);
  
    return (
      <div className="task-section">
        <div className={`task-header ${color}`} onClick={() => setOpenSections((prev) => ({ ...prev, [status]: !prev[status] }))}>
          <strong>
            {status} ({filteredTasks.length})
          </strong>
          {openSections[status] ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
        </div>
        {openSections[status] && (
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filteredTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              <div className="task-content">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => <TaskCard key={task.id} task={task} />) : <p>No Tasks in {status}</p>}
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
        {renderTaskSection("Todo", "pink")}
        {renderTaskSection("In-Progress", "blue")}
        {renderTaskSection("Completed", "green")}
      </div>
    </>
  );
};

export default TaskListView;


