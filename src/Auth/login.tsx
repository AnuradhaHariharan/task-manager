import React from "react";
import SignInwithGoogle from "./signInWIthGoogle";

const Login: React.FC = () => {
  return (
    <div className="login-container">
      {/* Left Side - Sign Up Section */}
      <div className="sign-up">
        <div className="logo">
          <img src="/logo.svg" alt="Logo" />
          <p>
            Streamline your workflow and track progress effortlessly
            <br /> with our all-in-one task management app.
          </p>
        </div>
        <SignInwithGoogle />
      </div>

      {/* Right Side - Background Circles */}
      <div className="bg-circles">
        <img className="circles-bg" src="/circles_bg.svg" alt="Background Circles" />
        <img className="task-view" src="/task_list_view.svg" alt="Task View" />
      </div>
    </div>
  );
};

export default Login;

