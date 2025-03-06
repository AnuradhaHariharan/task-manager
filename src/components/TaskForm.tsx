import React, { useState } from "react";
import { db, auth, storage } from "../Auth/firebase.tsx";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import '../styles/Taskform.css';

const TaskForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Work");
  const [status, setStatus] = useState("To Do");
  const [dueDate, setDueDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadTask, setUploadTask] = useState<any>(null); // Store upload task

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formatDate = (date: string) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const today = new Date();
    console.log(today)
    today.setHours(0, 0, 0, 0); 

  const selectedDate = dueDate ? new Date(dueDate) : today;
  selectedDate.setHours(0, 0, 0, 0); // Remove time part for comparison

  if (selectedDate < today) {
    alert("Due date cannot be in the past.");
    setLoading(false);
    return; // Stop form submission if the date is in the past
  }


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
        const uploadTaskInstance = uploadBytesResumable(storageRef, file);

        setUploadTask(uploadTaskInstance); // Store upload task for cancellation

        uploadTaskInstance.on(
          "state_changed",
          (snapshot) => {
            // Track upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            setError("File upload failed.");
            setLoading(false);
          },
          async () => {
            // Get file URL when upload completes
            fileUrl = await getDownloadURL(uploadTaskInstance.snapshot.ref);

            const formattedDueDate = dueDate ? formatDate(dueDate) : formatDate(new Date().toISOString());
            const formattedCreatedAt = formatDate(new Date().toISOString());


            await addDoc(collection(db, "tasks"), {
              title,
              description,
              category,
              status,
              userId: user.uid,
              attachment: fileUrl,
              dueDate: formattedDueDate,
              createdAt: formattedCreatedAt, 
            });

            // Reset form fields
            setTitle("");
            setDescription("");
            setCategory("Work");
            setStatus("To Do");
            setFile(null);
            setDueDate("");
            setUploadProgress(0);
            setIsOpen(false);
          }
        );
      } else {
        const formattedDueDate = dueDate ? formatDate(dueDate) : formatDate(new Date().toISOString());
        const formattedCreatedAt = formatDate(new Date().toISOString());

        await addDoc(collection(db, "tasks"), {
          title,
          description,
          category,
          status,
          userId: user.uid,
          attachment: fileUrl,
          dueDate: formattedDueDate,
          createdAt: formattedCreatedAt, 
        });

        // Reset form fields
        setTitle("");
        setDescription("");
        setCategory("Work");
        setStatus("To Do");
        setFile(null);
        setDueDate("");
        setIsOpen(false);
      }
    } catch (err) {
      setError("Failed to add task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (uploadTask) {
      uploadTask.cancel(); // Cancel ongoing upload
    }
    setIsOpen(false);
    setLoading(false);
  };

  return (
    <>
      <button className="add-task-btn" onClick={() => setIsOpen(true)}>
        Add Task
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <button className="close-btn" onClick={handleCancel}>
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
                className="description"
              />
              <div className="form-info">
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  required
                />
              </div>
              <input type="file" onChange={handleFileChange} />
              {file && <p>Selected File: {file.name}</p>}

              {uploadProgress > 0 && <p>Uploading: {Math.round(uploadProgress)}%</p>}

              <div className="submit-container">
                <button className="cancel-btn" type="button" onClick={handleCancel}>
                  CANCEL
                </button>
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




