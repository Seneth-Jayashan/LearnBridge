import { Link } from "react-router-dom";

const AdminPanel = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Panel</h1>
      <p>Manage the entire system from here.</p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
        
        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Users</h3>
          <p>Create Teachers, Students, and Admins.</p>
          <Link to="/admin/users">Manage Users &rarr;</Link>
        </div>

        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Classes & Levels</h3>
          <p>Setup school structure.</p>
          <Link to="/admin/levels">Manage Levels &rarr;</Link>
        </div>

        <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h3>Grades</h3>
          <p>Configure grading systems.</p>
          <Link to="/grades">Manage Grades &rarr;</Link>
        </div>

      </div>
      
      <div style={{ marginTop: "30px" }}>
        <Link to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default AdminPanel;