// src/pages/donor/PaymentSuccess.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/donor"), 3000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-sm">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-[#0A1D32] mb-2">
          Payment Successful!
        </h1>
        <p className="text-slate-400 text-sm">
          Thank you for supporting this school ❤️
        </p>
        <p className="text-xs text-slate-300 mt-4">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}