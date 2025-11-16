import { ArrowRight } from 'lucide-react';
import DotGrid from './DotGrid';
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const onGetStarted = () => {
    navigate("/query-data");
  };
  return (
    // Set min-h-screen to ensure the wrapper covers the viewport for the grid
    <div className="relative w-screen min-h-screen bg-slate-50 overflow-hidden">

      {/* 🧩 DotGrid Background */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          // Customize the grid appearance
          dotSize={7}
          gap={40}
          proximity={180}
          baseColor="#e0e7ff" // Light Indigo for base dots
          activeColor="#4f46e5" // Indigo-600 for active dots
          shockRadius={200}
          shockStrength={10}
          resistance={800}
          returnDuration={1.2}
        />
      </div>

      {/* Center Content (Title and Button) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="text-center space-y-6 max-w-2xl px-8 pointer-events-auto">
          <div className="inline-block animate-fade-in">
            <div className='flex flex-row items-center gap-2 text-blue-800'>
            
              <h1 className="text-6xl tracking-tight mb-2 font-extrabold">
                Queryon
              </h1>
              <div>
                <img src="/src/assets/logo.svg" className="w-[80px]" alt="Logo" style={{ color: "blue" }} />
              </div>
            </div>
          </div>

          <p className="text-xl text-slate-700 animate-fade-in-delay">
            Transform your company's data into actionable insights
          </p>

          <button
            onClick={onGetStarted}
            className="group relative px-8 py-4 bg-blue-800 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl mt-8 animate-fade-in-delay-2 transform-gpu"
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}
.animate-fade-in-delay {
  opacity: 0;
  animation: fadeIn 0.8s ease-out 0.2s forwards;
}
.animate-fade-in-delay-2 {
  opacity: 0;
  animation: fadeIn 0.8s ease-out 0.4s forwards;
}
.animate-fade-in-delay-3 {
  opacity: 0;
  animation: fadeIn 0.8s ease-out 0.6s forwards;
}
`}</style>
    </div>
  );
}