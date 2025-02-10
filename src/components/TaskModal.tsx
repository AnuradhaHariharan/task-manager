import React, { useState, useEffect } from "react";
import { db } from "../Auth/firebase.tsx"; // Adjust the import path based on your setup
import { doc, updateDoc } from "firebase/firestore";
import "../styles/TaskModal.css";

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
  attachment?: string;
  lastUpdated?: string;
  createdAt: string;
  changeLog?: {
    field: string;
    oldValue: string;
    newValue: string;
    time: string;
  }[];
}

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Partial<Task>>({});
  const [changeLog, setChangeLog] = useState<Task["changeLog"]>([]);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setChangeLog(task.changeLog || []);
      setPendingChanges({}); // Reset pending changes
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const formatDate = (date: string | number | Date) =>
    new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setPendingChanges((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (editedTask) {
      const timestamp = new Date().toISOString(); // Firestore format
  
      // Ensure the changes from pendingChanges are applied to the editedTask
      const updatedTask: Task = {
        ...editedTask, // Keep previous task data
        ...pendingChanges, // Apply pending changes
        lastUpdated: timestamp, // Update timestamp
        changeLog: [
          ...changeLog,
          ...Object.keys(pendingChanges).map((field) => ({
            field,
            oldValue: (editedTask as any)[field] || "N/A",
            newValue: (pendingChanges as any)[field],
            time: timestamp,
          })),
        ],
      };
  
      try {
        const taskRef = doc(db, "tasks", editedTask.id); // Firestore reference
        console.log("Updating task:", updatedTask); // Check the updated task before sending to Firestore
  
        // Update Firestore with the updated task
        await updateDoc(taskRef, updatedTask);
  
        onSave(updatedTask); // Update local state/UI
        onClose(); // Close modal after saving
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  };
  

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <div className="modal-body">
          {/* Left Side - Scrollable Task Edit Form */}
          <div className="task-edit-form">
            <h3>Edit Task</h3>
            <div className="scrollable-content">
              <input
                type="text"
                name="title"
                defaultValue={editedTask.title}
                onChange={handleChange}
              />
              <textarea
                name="description"
                defaultValue={editedTask.description}
                onChange={handleChange}
              />
              <select
                name="status"
                defaultValue={editedTask.status}
                onChange={handleChange}
              >
                <option value="Todo">Todo</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Right Side - Activity Log */}
          <div className="task-details">
            <h4 className="activity">Activity</h4>
            <div className="task-creation">
              <p>You created this task</p>
              <p>{formatDate(task.createdAt)}</p> {/* Format createdAt */}
            </div>

            {changeLog.length > 0 && (
              <div className="change-log">
                {changeLog.map((log, index) => (
                  <div key={index} className="change-entry">
                    <p>
                      You changed {log.field} from {log.oldValue} to{" "}
                      {log.newValue}
                    </p>
                    <p className="change-time">({formatDate(log.time)})</p>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;

