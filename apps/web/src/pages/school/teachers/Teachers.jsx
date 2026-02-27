import { useState } from "react";
import { Link } from "react-router-dom";
import { useSchoolAdmin } from "../../../contexts/SchoolAdminContext";
import { 
  FiPlus, FiSearch, FiCheckCircle, FiTrash2, 
  FiUserCheck, FiClock, FiAlertCircle
} from "react-icons/fi";

const Teachers = () => {
  const { verifiedTeachers, pendingTeachers, verifyTeacher, removeTeacher, loading } = useSchoolAdmin();
  
  const [activeTab, setActiveTab] = useState("verified"); // "verified" | "pending"
  const [searchTerm, setSearchTerm] = useState("");

  const handleVerify = async (id) => {
    if (window.confirm("Approve this teacher to join your school's faculty?")) {
      await verifyTeacher(id);
    }
  };

  const handleRemove = async (id) => {
    if (window.confirm("Are you sure you want to remove this teacher from your school? They will become a standalone teacher.")) {
      await removeTeacher(id);
    }
  };

  // Determine which list to show and apply search filter
  const currentList = activeTab === "verified" ? verifiedTeachers : pendingTeachers;
  const filteredTeachers = currentList.filter(t => 
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phoneNumber?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manage Faculty</h1>
          <p className="text-slate-500 mt-1">Manage your active teaching staff and review pending requests.</p>
        </div>
        <Link 
          to="/school/teachers/create" 
          className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 shrink-0"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add New Teacher</span>
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("verified")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "verified" ? "bg-white text-[#207D86] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <FiUserCheck className="w-4 h-4" /> Verified Staff ({verifiedTeachers.length})
          </button>
          <button 
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pending" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <FiClock className="w-4 h-4" /> Pending Requests ({pendingTeachers.length})
          </button>
        </div>

        {/* Search */}
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center min-w-75">
          <FiSearch className="text-slate-400 w-5 h-5 mr-3" />
          <input 
            type="text"
            placeholder="Search teachers..."
            className="w-full outline-none text-slate-700 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-[#207D86]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#207D86]"></div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center text-slate-500">
            <FiAlertCircle className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-700">No teachers found</p>
            <p className="text-sm mt-1">
              {activeTab === "verified" 
                ? "You don't have any verified teachers yet." 
                : "There are no pending requests at this time."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Teacher Name</th>
                  <th className="p-4 font-semibold">Contact Details</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Identity */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#0E2A47] to-[#207D86] flex items-center justify-center text-white font-bold shrink-0">
                          {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{teacher.firstName} {teacher.lastName}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">Joined {new Date(teacher.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      <div className="text-sm text-slate-800">{teacher.email}</div>
                      <div className="text-sm text-slate-500">{teacher.phoneNumber}</div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {activeTab === "verified" ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit bg-green-100 text-green-700">
                          <FiCheckCircle /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit bg-amber-100 text-amber-700">
                          <FiClock /> Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {activeTab === "pending" ? (
                          <button 
                            onClick={() => handleVerify(teacher._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                          >
                            <FiCheckCircle /> Approve
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRemove(teacher._id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from School"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        )}
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

export default Teachers;