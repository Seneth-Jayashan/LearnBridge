import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  FiSearch, FiAlertCircle, FiLoader, 
  FiBookOpen, FiClock, FiArrowRight, FiUser 
} from "react-icons/fi";
import knowledgeBaseService from "../../services/KnowledgeBaseService";

const CATEGORIES = ["All", "Academics", "Technology", "Teaching Guides", "Student Resources", "Extracurricular"];

const KnowledgeBasePublic = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering States
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setError("");
        setIsLoading(true);
        // Fetch all based on search query
        const data = await knowledgeBaseService.getPublicEntries(query);
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load knowledge base");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search input to prevent spamming the API
    const timer = setTimeout(() => {
      loadEntries();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Frontend filtering for Categories
  const filteredEntries = entries.filter((entry) => {
    if (activeCategory === "All") return true;
    // Fallback safely just in case category is undefined
    return entry.category === activeCategory; 
  });

  return (
    <section className="max-w-7xl mx-auto w-full space-y-10">
      
      {/* --- Header Banner --- */}
      <div className="bg-linear-to-br from-[#0A1D32] via-[#0E2A47] to-[#207D86] rounded-4xl p-10 md:p-14 text-center text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto font-light">
            Explore helpful guides, educational resources, and best practices shared by our verified teachers.
          </p>
        </div>
      </div>

      {/* --- Search & Filters Area --- */}
      <div className="relative -mt-16 z-20 px-4 max-w-4xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden focus-within:ring-4 focus-within:ring-[#207D86]/10 focus-within:border-[#207D86] transition-all">
          <div className="pl-6 text-slate-400">
            <FiSearch size={22} />
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles, guides, or topics..."
            className="w-full bg-transparent border-none px-4 py-4 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-lg"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm border ${
                activeCategory === cat
                  ? "bg-[#207D86] text-white border-[#207D86] shadow-[#207D86]/20"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#207D86] hover:text-[#207D86]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- Content Area --- */}
      <div className="px-4">
        {error && (
          <div className="max-w-3xl mx-auto flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 mb-8 animate-in fade-in">
            <FiAlertCircle className="shrink-0" size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
            <FiLoader size={32} className="animate-spin text-[#207D86]" />
            <p className="text-sm font-bold tracking-wide uppercase">Searching Knowledge Base...</p>
          </div>
        ) : (
          <>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiBookOpen size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#0A1D32] mb-2">No articles found</h3>
                <p className="text-slate-500">
                  {query 
                    ? `We couldn't find anything matching "${query}" in the "${activeCategory}" category.` 
                    : `No published articles found in the "${activeCategory}" category.`}
                </p>
                {(query || activeCategory !== "All") && (
                  <button 
                    onClick={() => { setQuery(""); setActiveCategory("All"); }}
                    className="mt-6 text-[#207D86] font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredEntries.map((entry) => (
                  <ArticleCard key={entry._id || entry.id} article={entry} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
    </section>
  );
};

// --- Reusable Card Component ---
const ArticleCard = ({ article }) => {
  // Format date safely
  const formattedDate = article.createdAt 
    ? new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recently added";

  return (
    <Link 
      to={`/knowledge-base/${article._id || article.id}`} 
      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md shadow-slate-200/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group h-full"
    >
      {/* Category Tag */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-[#207D86]/10 text-[#207D86] text-xs font-bold uppercase tracking-wider rounded-lg">
          {article.category || "General"}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-black text-[#0A1D32] mb-3 group-hover:text-[#207D86] transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 grow">
        {article.description || article.excerpt || "Click to read more about this topic..."}
      </p>

      {/* Footer Info (Author & Date) */}
      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <FiUser size={12} />
          </div>
          <span>{article.authorName || "Teacher"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FiClock size={12} />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default KnowledgeBasePublic;