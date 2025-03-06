import React from "react";
import { auth } from "../Auth/firebase.tsx";
import { FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

interface NavbarProps {
  viewMode: "list" | "board";
  setViewMode: React.Dispatch<React.SetStateAction<"list" | "board">>;
}

const Navbar: React.FC<NavbarProps> = ({ viewMode, setViewMode }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="left-container">
      <div className="logo-container">
      <img src={`${process.env.PUBLIC_URL}/logo.svg`} alt="Logo" />
     </div>

    
      <div className="view-toggle">
        <div
          className={`list ${viewMode === "list" ? "active" : ""}`}
          onClick={() => setViewMode("list")}
        >
      <img src={`${process.env.PUBLIC_URL}/list_icon.svg`} alt="List View" />
          <p>List</p>
        </div>
        <div
          className={`group ${viewMode === "board" ? "active" : ""}`}
          onClick={() => setViewMode("board")}
        >
        <img src={`${process.env.PUBLIC_URL}/group_view.svg`} alt="Board View" />
          <p>Board</p>
        </div>
      </div>
      </div>

      <div className="profile">
        <div className="name_photo">
        <img src={`${process.env.PUBLIC_URL}/user-img.png`} alt="Profile" />
          <span>{auth.currentUser?.displayName}</span>
        </div>
        <button onClick={handleLogout} className="logout">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
