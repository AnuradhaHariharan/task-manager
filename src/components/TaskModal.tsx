import React, { useState } from "react";
import "../styles/TaskModal.css"; // Create styles as needed

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Todo" | "In-Progress" | "Completed";
  dueDate: string;
  attachment?: string; // Optional field for attachments
}

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [editedTask, setEditedTask] = useState<Task | null>(task);

  if (!task) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedTask((prev) =>
      prev ? { ...prev, [e.target.name]: e.target.value } : null
    );
  };

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <div className="modal-body">
          {/* Left Side - Task Details */}
          <div className="task-edit-form">
            <h3>Edit Task</h3>
            <input
              type="text"
              name="title"
              value={editedTask?.title || ""}
              onChange={handleChange}
            />
            <textarea
              name="description"
              value={editedTask?.description || ""}
              onChange={handleChange}
            />
            <select name="status" value={editedTask?.status || ""} onChange={handleChange}>
              <option value="Todo">Todo</option>
              <option value="In-Progress">In-Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          {/* Right Side - Edit Form */}
          <div className="task-details">
            <h2>{task.title}</h2>
            <p><strong>Category:</strong> {task.category}</p>
            <p><strong>Status:</strong> {task.status}</p>
            <p><strong>Due Date:</strong> {task.dueDate}</p>
            <p><strong>Description:</strong> {task.description}</p>
            {task.attachment && (
              <div>
                <strong>Attachment:</strong>
                <a href={task.attachment} target="_blank" rel="noopener noreferrer">
                  View File
                </a>
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
