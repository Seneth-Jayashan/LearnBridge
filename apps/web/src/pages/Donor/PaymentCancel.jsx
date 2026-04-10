import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-[#0A1D32] mb-2">
          Payment Cancelled
        </h1>
        <p className="text-slate-400 text-sm">
          Your payment was cancelled. No charges were made.
        </p>
        <button
          onClick={() => navigate("/donor")}
          className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-xl bg-linear-to-r from-[#207D86] to-[#4CAF50] text-white hover:shadow-lg transition-all duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}