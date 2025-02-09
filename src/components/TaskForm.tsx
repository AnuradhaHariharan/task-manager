import React, { useState } from "react";
import { db, auth, storage } from "../Auth/firebase.tsx";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import '../styles/Taskform.css'

const TaskForm: React.FC<TaskFormProps> = ({ show, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Work");
  const [status, setStatus] = useState("To Do");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);  // ✅ Added file state

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      let fileUrl = "";
      if (file) {
        const storageRef = ref(storage, `tasks/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "tasks"), {
        title,
        description,
        category,
        status,
        userId: user.uid,
        attachment: fileUrl, // ✅ Store uploaded file URL
        dueDate: new Date(),
      });

      // ✅ Reset form fields
      setTitle("");
      setDescription("");
      setCategory("Work");
      setStatus("To Do");
      setFile(null);
      setIsOpen(false);
    } catch (err) {
      setError("Failed to add task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="add-task-btn" onClick={() => setIsOpen(true)}>
        Add Task
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              &times;
            </button>
            <p className="create-task-heading">Create task</p>
            </div>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task Title"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task Description"
                required
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              
              {/* ✅ File Upload */}
              <input type="file" onChange={handleFileChange} />
              {file && <p>Selected File: {file.name}</p>}
              <div className="submit-container">
              <button className="cancel-btn" onClick={() => setIsOpen(false)}>CANCEL</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "CREATING..." : "CREATE"}
              </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskForm;


