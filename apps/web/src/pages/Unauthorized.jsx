import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1 style={{ color: "red", fontSize: "3rem" }}>403</h1>
      <h2>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginTop: "20px", padding: "10px 20px", cursor: "pointer" }}
      >
        Go Back
      </button>
    </div>
  );
};

export default Unauthorized;