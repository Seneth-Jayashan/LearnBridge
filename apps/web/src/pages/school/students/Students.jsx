import { useState } from "react";
import { Link } from "react-router-dom";
import { useSchoolAdmin } from "../../../contexts/SchoolAdminContext";
import { 
  FiPlus, FiEdit, FiSearch, 
  FiCheckCircle, FiXCircle 
} from "react-icons/fi";

const Students = () => {
  const { students, loading, toggleStudentActiveStatus } = useSchoolAdmin();
  const [searchTerm, setSearchTerm] = useState("");

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this student?`)) {
      await toggleStudentActiveStatus(id);
    }
  };

  // Filter Logic
  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.regNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manage Students</h1>
          <p className="text-slate-500 mt-1">View and manage students enrolled in your school.</p>
        </div>
        <Link 
          to="/school/students/create" 
          className="flex items-center gap-2 bg-[#207D86] hover:bg-[#186269] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-[#207D86]/30 shrink-0"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add New Student</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center">
        <FiSearch className="text-slate-400 w-5 h-5 ml-2" />
        <input 
          type="text"
          placeholder="Search by name, reg number, or email..."
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
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Contact Info</th>
                  <th className="p-4 font-semibold">Academic Info</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Student Identity */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#207D86] to-[#4CAF50] flex items-center justify-center text-white font-bold shrink-0">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{student.firstName} {student.lastName}</div>
                          <div className="text-xs font-mono text-[#207D86] bg-[#207D86]/10 px-2 py-0.5 rounded inline-block mt-1">
                            {student.regNumber || "Pending..."}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      <div className="text-sm text-slate-800">{student.email || "N/A"}</div>
                      <div className="text-sm text-slate-500">{student.phoneNumber}</div>
                    </td>

                    {/* Academic */}
                    <td className="p-4">
                      <div className="text-sm text-slate-800">{student.grade?.name || "No Grade Assigned"}</div>
                      <div className="text-xs text-slate-500">{student.level?.name || "No Level"}</div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${student.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {student.isActive ? <FiCheckCircle /> : <FiXCircle />}
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Toggle */}
                        <button 
                          onClick={() => handleToggleStatus(student._id, student.isActive)} 
                          title={student.isActive ? "Deactivate Student" : "Activate Student"} 
                          className={`p-2 rounded-lg transition-colors ${student.isActive ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-400 hover:text-green-500 hover:bg-green-50"}`}
                        >
                          {student.isActive ? <FiXCircle className="w-5 h-5" /> : <FiCheckCircle className="w-5 h-5" />}
                        </button>

                        {/* Edit Button */}
                        <Link 
                          to={`/school/students/edit/${student._id}`} 
                          className="p-2 text-slate-400 hover:text-[#207D86] hover:bg-[#207D86]/10 rounded-lg transition-colors"
                        >
                          <FiEdit className="w-5 h-5" />
                        </Link>
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

export default Students;