import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import adminService from "../../../services/AdminService";
import { FiPlus, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const data = await adminService.getAllSchools();
      setSchools(data);
    } catch (err) {
      setError("Failed to load schools. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this school?")) {
      try {
        await adminService.deleteSchool(id);
        setSchools(schools.filter(school => school._id !== id));
      } catch (err) {
        alert("Failed to delete school.");
      }
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manage Schools</h1>
          <p className="text-slate-500 mt-1">View and manage all registered institutions.</p>
        </div>
        <Link 
          to="/admin/schools/create" 
          className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add New School</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center">
        <FiSearch className="text-slate-400 w-5 h-5 ml-2" />
        <input 
          type="text"
          placeholder="Search schools by name..."
          className="w-full pl-3 pr-4 py-2 outline-none text-slate-700 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-[#207D86]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#207D86]"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredSchools.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No schools found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">School Name</th>
                  <th className="p-4 font-semibold">Contact Info</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((school) => (
                  <tr key={school._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                          {school.logoUrl ? (
                            <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-slate-400">{school.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-semibold text-slate-800">{school.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-800">{school.contactEmail || "N/A"}</div>
                      <div className="text-sm text-slate-500">{school.contactPhone || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${school.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {school.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/schools/edit/${school._id}`} className="p-2 text-slate-400 hover:text-[#207D86] hover:bg-[#207D86]/10 rounded-lg transition-colors">
                          <FiEdit className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(school._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

export default Schools;