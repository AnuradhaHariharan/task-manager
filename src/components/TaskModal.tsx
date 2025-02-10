import React, { useState, useEffect } from "react";
import { db } from "../Auth/firebase.tsx"; // Adjust the import path based on your setup
import { doc, updateDoc,arrayUnion ,getDoc} from "firebase/firestore";
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
    const fetchTask = async () => {
      if (task) {
        try {
          const taskRef = doc(db, "tasks", task.id);
          const taskSnap = await getDoc(taskRef);
          if (taskSnap.exists()) {
            const updatedTask = taskSnap.data() as Task;
            setEditedTask(updatedTask);
            setChangeLog(updatedTask.changeLog || []);
          }
        } catch (error) {
          console.error("Error fetching task:", error);
        }
      }
    };
  
    fetchTask();
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
      const timestamp = new Date().toISOString();
  
      // Map pending changes into changeLog entries
      const newChangeLogEntries = Object.keys(pendingChanges).map((field) => ({
        field,
        oldValue: (editedTask as any)[field] || "N/A",
        newValue: (pendingChanges as any)[field],
        time: timestamp,
      }));
  
      try {
        const taskRef = doc(db, "tasks", editedTask.id);
  
        // Update Firestore using arrayUnion to append changeLog instead of replacing it
        await updateDoc(taskRef, {
          ...pendingChanges, // Update only changed fields
          lastUpdated: timestamp,
          changeLog: arrayUnion(...newChangeLogEntries),
        });
  
        // Update local state
        const updatedTask: Task = {
          ...editedTask,
          ...pendingChanges,
          lastUpdated: timestamp,
          changeLog: [...changeLog, ...newChangeLogEntries],
        };
  
        onSave(updatedTask); // Update UI
        onClose(); // Close modal
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  };
  const convertToISODate = (dateStr: string) => {
    if (!dateStr) return ""; // Handle empty value
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert DD/MM/YYYY to YYYY-MM-DD
      const dateObj = new Date(formattedDate);
      return !isNaN(dateObj.getTime())
        ? dateObj.toISOString().split("T")[0]
        : "";
    }
    return "";
  };
  const handleCancel = () => {
    setPendingChanges({}); // Reset changes
    setEditedTask(task); // Revert to original task
    onClose(); // Close modal
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

              {/* Date Input for Due Date */}
              <input
                type="date"
                name="dueDate"
                defaultValue={convertToISODate(editedTask.dueDate)}
                onChange={handleChange}
              />

              {/* File Input for Attachments */}
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Right Side - Activity Log */}
          <div className="task-details">
            <div>
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
             </div>
             <div className="buttons">
              <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
             <button onClick={handleSave} className="submit-btn">Update</button>
             </div>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
