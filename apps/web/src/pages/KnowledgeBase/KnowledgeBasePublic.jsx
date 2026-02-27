import { useEffect, useState } from "react";
import KnowledgeBaseList from "./KnowledgeBaseList";
import knowledgeBaseService from "../../services/KnowledgeBaseService";

const KnowledgeBasePublic = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadEntries = async () => {
      try {
        setError("");
        setIsLoading(true);
        const data = await knowledgeBaseService.getPublicEntries(query);
        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load knowledge base");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadEntries();
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0E2A47]">Knowledge Base</h1>
        <p className="text-slate-600 mt-1">Helpful guides and resources from teachers.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#207D86]"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading knowledge base...</div>
      ) : (
        <KnowledgeBaseList
          entries={entries}
          emptyMessage="No published knowledge base articles found."
        />
      )}
    </section>
  );
};

export default KnowledgeBasePublic;
