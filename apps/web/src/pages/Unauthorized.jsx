import { useNavigate } from "react-router-dom";
import { FiShield, FiArrowLeft, FiHome } from "react-icons/fi";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* --- Animated Background Glows --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-red-500/5 rounded-full blur-[100px] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none -z-10"></div>
      <div className="absolute top-0 right-10 w-72 h-72 bg-slate-300/20 rounded-full blur-[80px] pointer-events-none -z-10"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700">
        
        {/* --- Floating Animated Icon --- */}
        <div className="relative mb-8 group">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 bg-red-100 rounded-full scale-[1.6] blur-xl opacity-60 group-hover:scale-[1.8] transition-transform duration-500"></div>
          
          {/* Shield Container */}
          <div className="w-24 h-24 bg-linear-to-br from-red-50 to-red-100 rounded-4xl flex items-center justify-center border-4 border-white shadow-2xl relative z-10 animate-[bounce_4s_ease-in-out_infinite]">
            <FiShield className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* --- Text Content --- */}
        <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-slate-800 to-slate-400 mb-2 drop-shadow-sm select-none">
          403
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-black text-[#0A1D32] tracking-tight mb-4">
          Access Denied
        </h2>
        
        <p className="text-slate-500 text-lg mb-10 max-w-md font-medium leading-relaxed">
          Hold up! You don't have the necessary permissions to view this page. If you believe this is an error, please contact your administrator.
        </p>

        {/* --- Action Buttons --- */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="px-8 py-4 bg-[#0A1D32] hover:bg-[#207D86] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0A1D32]/20 transition-all duration-300 flex justify-center items-center gap-3 group hover:-translate-y-1"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <button 
            onClick={() => navigate("/")} 
            className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-[#0A1D32] text-slate-600 hover:text-[#0A1D32] text-sm font-bold rounded-xl transition-all duration-300 flex justify-center items-center gap-3 group hover:-translate-y-1 hover:shadow-md"
          >
            <FiHome className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Return Home
          </button>
        </div>

      </div>
    </div>
  );
};

export default Unauthorized;