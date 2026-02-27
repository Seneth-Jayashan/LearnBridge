import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import adminService from "../../../services/AdminService";
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, 
  FiLock, FiUnlock, FiCheckCircle, FiXCircle, FiFilter 
} from "react-icons/fi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to completely delete this user?")) {
      try {
        await adminService.deleteUser(id);
        setUsers(users.filter(user => user._id !== id));
      } catch (err) {
        alert("Failed to delete user.");
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await adminService.toggleUserStatus(id);
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      alert("Failed to change user status.");
    }
  };

  const handleToggleLock = async (id, currentLockStatus) => {
    try {
      await adminService.toggleUserLock(id);
      setUsers(users.map(u => u._id === id ? { ...u, isLocked: !currentLockStatus } : u));
    } catch (err) {
      alert("Failed to change lock status.");
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber?.includes(searchTerm);
    
    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const RoleBadge = ({ role }) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-700 border-purple-200",
      school_admin: "bg-blue-100 text-blue-700 border-blue-200",
      teacher: "bg-amber-100 text-amber-700 border-amber-200",
      student: "bg-emerald-100 text-emerald-700 border-emerald-200",
      donor: "bg-rose-100 text-rose-700 border-rose-200"
    };
    const style = colors[role] || "bg-slate-100 text-slate-700";
    
    return (
      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${style}`}>
        {role.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manage Users</h1>
          <p className="text-slate-500 mt-1">View, filter, and manage all platform users.</p>
        </div>
        <Link 
          to="/admin/users/create" 
          className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 shrink-0"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add New User</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-100">
          <FiSearch className="text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by name, email, or phone..."
            className="w-full pl-3 pr-4 py-2.5 outline-none text-slate-700 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="md:w-64 flex items-center bg-slate-50 rounded-xl px-3 border border-slate-100">
          <FiFilter className="text-slate-400 w-5 h-5 shrink-0" />
          <select 
            className="w-full pl-3 py-2.5 outline-none text-slate-700 bg-transparent cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="donor">Donor</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-[#207D86]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#207D86]"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No users found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Status / Security</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white font-bold shrink-0">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-slate-500">{user.email || user.phoneNumber}</div>
                          {user.regNumber && <div className="text-xs text-[#207D86] font-mono mt-0.5">{user.regNumber}</div>}
                        </div>
                      </div>
                    </td>
                    
                    {/* Role */}
                    <td className="p-4">
                      <RoleBadge role={user.role} />
                    </td>
                    
                    {/* Status & Security */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {user.isActive ? <FiCheckCircle className="text-green-500 w-4 h-4"/> : <FiXCircle className="text-red-500 w-4 h-4"/>}
                          <span className={`text-xs font-medium ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {user.isLocked ? <FiLock className="text-amber-500 w-4 h-4"/> : <FiUnlock className="text-slate-400 w-4 h-4"/>}
                          <span className={`text-xs font-medium ${user.isLocked ? "text-amber-600" : "text-slate-500"}`}>
                            {user.isLocked ? "Account Locked" : "Unlocked"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* Status Toggle */}
                        <button onClick={() => handleToggleStatus(user._id, user.isActive)} title={user.isActive ? "Deactivate User" : "Activate User"} className={`p-2 rounded-lg transition-colors ${user.isActive ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-400 hover:text-green-500 hover:bg-green-50"}`}>
                          {user.isActive ? <FiXCircle className="w-5 h-5" /> : <FiCheckCircle className="w-5 h-5" />}
                        </button>

                        {/* Lock Toggle */}
                        <button onClick={() => handleToggleLock(user._id, user.isLocked)} title={user.isLocked ? "Unlock Account" : "Lock Account"} className={`p-2 rounded-lg transition-colors ${user.isLocked ? "text-amber-500 bg-amber-50 hover:bg-amber-100" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}>
                          {user.isLocked ? <FiUnlock className="w-5 h-5" /> : <FiLock className="w-5 h-5" />}
                        </button>

                        {/* Edit & Delete */}
                        <Link to={`/admin/users/edit/${user._id}`} className="p-2 text-slate-400 hover:text-[#207D86] hover:bg-[#207D86]/10 rounded-lg transition-colors">
                          <FiEdit className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(user._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;