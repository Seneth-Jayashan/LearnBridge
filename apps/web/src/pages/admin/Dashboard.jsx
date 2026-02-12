import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Dashboard = () => {
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
        <h1>Welcome, {user?.firstName}!</h1>
        <button onClick={handleLogout} style={{ padding: "8px 16px" }}>Logout</button>
      </header>

      <div style={{ marginTop: "20px" }}>
        <h3>Your Role: <span style={{ textTransform: "capitalize", color: "blue" }}>{user?.role}</span></h3>
        
        <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
           {/* Common Action */}
           <Link to="/profile" style={{ padding: "10px", border: "1px solid #333", textDecoration: "none", color: "black" }}>
             Edit Profile
           </Link>

           {/* Role Based Actions */}
           {isAdmin && (
             <Link to="/admin" style={{ padding: "10px", backgroundColor: "#333", color: "white", textDecoration: "none" }}>
               Go to Admin Panel
             </Link>
           )}

           {(isTeacher || isAdmin) && (
             <Link to="/grades" style={{ padding: "10px", border: "1px solid green", textDecoration: "none", color: "green" }}>
               Manage Grades
             </Link>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;