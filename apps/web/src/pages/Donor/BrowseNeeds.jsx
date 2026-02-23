// src/pages/donor/BrowseNeeds.jsx
import { useEffect, useState } from "react";
import { getAllNeeds, pledgeDonation } from "../../services/DonorServices";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 6;

const urgencyColor = {
  High: "bg-red-500/10 text-red-400 border border-red-500/30",
  Medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  Low: "bg-green-500/10 text-green-400 border border-green-500/30",
};

export default function BrowseNeeds() {
  const [needs,setNeeds]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(true);
  const [pledging,setPledging]=useState(null);
  const [currentPage,setCurrentPage]=useState(1);

  const [filters,setFilters]=useState({search:"",urgency:"",status:""});

  useEffect(()=>{fetchNeeds();},[]);

  const fetchNeeds=async()=>{
    try{
      setLoading(true);
      const res=await getAllNeeds();
      setNeeds(res.data);
      setFiltered(res.data);
    }catch(err){
      toast.error("Failed to load needs.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    let result=[...needs];
    if(filters.search){
      result=result.filter(n=>n.itemName.toLowerCase().includes(filters.search.toLowerCase()));
    }
    if(filters.urgency){result=result.filter(n=>n.urgency===filters.urgency);}
    if(filters.status){result=result.filter(n=>n.status===filters.status);}
    setFiltered(result);
    setCurrentPage(1);
  },[filters,needs]);

  const handlePledge=async(id)=>{
    try{
      setPledging(id);
      await pledgeDonation(id);
      toast.success("Thank you for supporting this school ❤️");
      fetchNeeds();
    }catch(err){
      toast.error("Could not pledge.");
    }finally{
      setPledging(null);
    }
  };

  const totalPages=Math.ceil(filtered.length/ITEMS_PER_PAGE);
  const paginated=filtered.slice((currentPage-1)*ITEMS_PER_PAGE,currentPage*ITEMS_PER_PAGE);

  if(loading){
    return(
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4CAF50]"/>
      </div>
    );
  }

  return(
    <div className="p-8 bg-[#0E2A47]/5 min-h-screen">

      <h1 className="text-2xl font-bold text-[#0A1D32] mb-1">Browse School Needs</h1>
      <p className="text-slate-500 text-sm mb-6">Support verified schools by pledging donations.</p>

      <div className="flex flex-wrap gap-3 mb-6 bg-white p-5 rounded-2xl border border-white/40 shadow-lg backdrop-blur-sm">

        <input
          type="text"
          placeholder="Search item..."
          value={filters.search}
          onChange={(e)=>setFilters({...filters,search:e.target.value})}
          className="rounded-xl px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86] transition w-52"
        />

        <select
          value={filters.urgency}
          onChange={(e)=>setFilters({...filters,urgency:e.target.value})}
          className="rounded-xl px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
        >
          <option value="">All Urgency</option>
          <option value="High">🔴 High</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🟢 Low</option>
        </select>

        <select
          value={filters.status}
          onChange={(e)=>setFilters({...filters,status:e.target.value})}
          className="rounded-xl px-4 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
        >
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="Pledged">Pledged</option>
          <option value="Fulfilled">Fulfilled</option>
        </select>

        <button
          onClick={()=>setFilters({search:"",urgency:"",status:""})}
          className="ml-auto text-sm font-medium text-[#207D86] hover:text-[#4CAF50] transition"
        >
          Clear Filters
        </button>

      </div>

      <p className="text-xs text-slate-400 mb-5">
        Showing {paginated.length} of {filtered.length} results
      </p>

      {paginated.length===0?(
        <div className="text-center text-slate-400 py-20 text-lg">
          No needs found
        </div>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.map((need)=>(
            <NeedCard
              key={need._id}
              need={need}
              onPledge={handlePledge}
              pledging={pledging}
            />
          ))}
        </div>
      )}

      {totalPages>1&&(
        <div className="flex justify-center gap-3 mt-10">
          {Array.from({length:totalPages},(_,i)=>i+1).map((page)=>(
            <button
              key={page}
              onClick={()=>setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage===page
                ?"bg-gradient-to-r from-[#207D86] to-[#4CAF50] text-white shadow-lg"
                :"bg-white text-slate-600 hover:bg-[#207D86]/10"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

function NeedCard({need,onPledge,pledging}){
  const {_id,schoolId,itemName,quantity,description,urgency,status,pledgedDate}=need;

  const statusStyle={
    Open:"bg-[#207D86]/10 text-[#207D86]",
    Pledged:"bg-yellow-500/10 text-yellow-500",
    Fulfilled:"bg-green-500/10 text-green-500"
  };

  const isOpen=status==="Open";

  return(
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1">

      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-[#0A1D32] text-base">{itemName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {schoolId?.name||"Verified School"}
          </p>
        </div>

        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${urgencyColor[urgency]}`}>
          {urgency}
        </span>
      </div>

      <p className="text-sm text-slate-500 line-clamp-2">
        {description||"No description"}
      </p>

      <div className="flex gap-4 text-xs text-slate-400">
        <span>Qty:<strong className="text-slate-700 ml-1">{quantity}</strong></span>
        {pledgedDate&&(
          <span>{new Date(pledgedDate).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100">

        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[status]}`}>
          {status}
        </span>

        <button
          onClick={()=>onPledge(_id)}
          disabled={!isOpen||pledging===_id}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
            isOpen
            ?"bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg hover:scale-105"
            :"bg-gray-100 text-gray-400"
          }`}
        >
          {pledging===_id?"Pledging...":isOpen?"Pledge ❤️":status}
        </button>

      </div>

    </div>
  );
}
