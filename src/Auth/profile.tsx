import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase.tsx"; // Ensure the correct import path
import { doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth"; // Import Firebase User type

// Define the type for user details
interface UserDetails {
  photo?: string;
  firstName: string;
  email: string;
}

const Profile: React.FC = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        console.log("User is not logged in");
        return;
      }
      console.log(user);

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserDetails(docSnap.data() as UserDetails);
        console.log(docSnap.data());
      } else {
        console.log("No user data found in Firestore");
      }
    });
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  async function handleLogout() {
    try {
      await auth.signOut();
      window.location.href = "/login";
      console.log("User logged out successfully!");
    } catch (error) {
      console.error("Error logging out:", (error as Error).message);
    }
  }

  return (
    <div>
      {userDetails ? (
        <>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={userDetails.photo || "/default-profile.png"} // Fallback for missing photo
              width={"40%"}
              style={{ borderRadius: "50%" }}
              alt="User Profile"
            />
          </div>
          <h3>Welcome {userDetails.firstName} 🙏🙏</h3>
          <div>
            <p>Email: {userDetails.email}</p>
            <p>First Name: {userDetails.firstName}</p>
          </div>
          <button className="btn btn-primary" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Profile;
