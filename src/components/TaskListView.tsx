import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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
  if (status === "Done") return "Completed";
  if (status === "To Do") return "Todo";
  if (status === "In Progress") return "In-Progress";
  return status as "Todo" | "In-Progress" | "Completed";
};

const TaskListView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openSections, setOpenSections] = useState({ Todo: true, "In-Progress": true, Completed: true });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Untitled",
            description: data.description || "No Description",
            category: data.category || "Uncategorized",
            status: normalizeStatus(data.status),
            dueDate: typeof data.dueDate === "string" ? data.dueDate : data.dueDate?.toDate().toLocaleDateString() || "No Due Date",
          };
        });
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
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

  const onDragEnd = (result: any) => {
    console.log("Drag result:", result);

    if (!result.destination) {
      console.log("Dropped outside the list");
      return;
    }

    const updatedTasks = [...tasks];
    const [movedTask] = updatedTasks.splice(result.source.index, 1);
    movedTask.status = result.destination.droppableId as "Todo" | "In-Progress" | "Completed";
    updatedTasks.splice(result.destination.index, 0, movedTask);

    setTasks(updatedTasks);
    updateTaskStatus(movedTask.id, movedTask.status);
  };

  const renderTaskSection = (status: "Todo" | "In-Progress" | "Completed", color: string) => {
    const filteredTasks = tasks.filter((task) => task.status === status);

    return (
      <Droppable droppableId={status} key={status}>
        {(provided) => (
          <div className="task-section">
            <div className={`task-header ${color}`} onClick={() => setOpenSections((prev) => ({ ...prev, [status]: !prev[status] }))}>
              <strong>
                {status} ({filteredTasks.length})
              </strong>
              {openSections[status] ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
            </div>
            {openSections[status] && (
              <div className="task-content" ref={provided.innerRef} {...provided.droppableProps}>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="task-card"
                          style={{
                            ...provided.draggableProps.style,
                            userSelect: "none",
                            padding: "10px",
                            margin: "5px 0",
                            backgroundColor: "white",
                            borderRadius: "5px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                          }}
                        >
                          <FaGripVertical className="drag-handle" />
                          <h5>{task.title}</h5>
                          <span>{task.dueDate}</span>
                          <span>{task.status}</span>
                          <span>{task.category}</span>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <p>No Tasks in {status}</p>
                )}
                {provided.placeholder}
              </div>
            )}
          </div>
        )}
      </Droppable>
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
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="task-list-view">
          {renderTaskSection("Todo", "pink")}
          {renderTaskSection("In-Progress", "blue")}
          {renderTaskSection("Completed", "green")}
        </div>
      </DragDropContext>
    </>
  );
};

export default TaskListView;



