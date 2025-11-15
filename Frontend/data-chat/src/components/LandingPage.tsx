import { useRef, useEffect, useState } from 'react';
import DomeGallery from './DomeGallery';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

// Generate random data
const generateData = (points: number = 6) => {
  return Array.from({ length: points }, () => Math.floor(Math.random() * 100) + 20);
};

// Generate chart image directly on canvas
const generateChartImage = (
  type: 'line' | 'bar' | 'area' | 'pie' | 'radar',
  index: number,
  data: number[]
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 400, 300);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  const titles = {
    line: 'Revenue Trend',
    bar: 'Sales Data',
    area: 'Growth Metrics',
    pie: 'Distribution',
    radar: 'Performance'
  };
  ctx.fillText(`${titles[type]} #${index}`, 20, 30);

  // Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  
  if (type !== 'pie' && type !== 'radar') {
    for (let i = 0; i <= 4; i++) {
      const y = 70 + i * 45;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(370, y);
      ctx.stroke();
    }
  }

  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  switch (type) {
    case 'line':
      ctx.strokeStyle = colors[0];
      ctx.fillStyle = colors[0];
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((value, i) => {
        const x = 50 + (i * 320) / (data.length - 1);
        const y = 250 - (value / 100) * 160;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      // Dots
      data.forEach((value, i) => {
        const x = 50 + (i * 320) / (data.length - 1);
        const y = 250 - (value / 100) * 160;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;

    case 'bar':
      const barWidth = 35;
      const spacing = 320 / data.length;
      data.forEach((value, i) => {
        const x = 50 + i * spacing + (spacing - barWidth) / 2;
        const height = (value / 100) * 160;
        const y = 250 - height;
        
        const gradient = ctx.createLinearGradient(0, y, 0, 250);
        gradient.addColorStop(0, colors[1]);
        gradient.addColorStop(1, colors[2]);
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, [4, 4, 0, 0]);
        ctx.fill();
      });
      break;

    case 'area':
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.beginPath();
      ctx.moveTo(50, 250);
      data.forEach((value, i) => {
        const x = 50 + (i * 320) / (data.length - 1);
        const y = 250 - (value / 100) * 160;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(370, 250);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = colors[2];
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((value, i) => {
        const x = 50 + (i * 320) / (data.length - 1);
        const y = 250 - (value / 100) * 160;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      break;

    case 'pie':
      const centerX = 200;
      const centerY = 160;
      const radius = 80;
      let currentAngle = -Math.PI / 2;
      const total = data.reduce((a, b) => a + b, 0);
      
      data.forEach((value, i) => {
        const sliceAngle = (value / total) * Math.PI * 2;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
      });
      break;

    case 'radar':
      const radarCenterX = 200;
      const radarCenterY = 160;
      const radarRadius = 90;
      const sides = data.length;
      
      // Draw grid circles
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(radarCenterX, radarCenterY, (radarRadius * i) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw grid lines
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const x = radarCenterX + radarRadius * Math.cos(angle);
        const y = radarCenterY + radarRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(radarCenterX, radarCenterY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      
      // Draw data
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.strokeStyle = colors[5];
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((value, i) => {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const distance = (value / 100) * radarRadius;
        const x = radarCenterX + distance * Math.cos(angle);
        const y = radarCenterY + distance * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw points
      ctx.fillStyle = colors[5];
      data.forEach((value, i) => {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const distance = (value / 100) * radarRadius;
        const x = radarCenterX + distance * Math.cos(angle);
        const y = radarCenterY + distance * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
  }

  return canvas.toDataURL('image/png');
};

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [chartImages, setChartImages] = useState<string[]>([]);
  const chartDataRef = useRef<{ type: 'line' | 'bar' | 'area' | 'pie' | 'radar'; data: number[] }[]>([]);

  useEffect(() => {
    // Initialize chart configurations
    const chartTypes: ('line' | 'bar' | 'area' | 'pie' | 'radar')[] = ['line', 'bar', 'area', 'pie', 'radar'];
    chartDataRef.current = Array.from({ length: 25 }, (_, i) => ({
      type: chartTypes[i % chartTypes.length],
      data: generateData(chartTypes[i % chartTypes.length] === 'pie' ? 5 : 6),
    }));

    // Generate initial images
    const updateImages = () => {
      const images = chartDataRef.current.map((config, i) =>
        generateChartImage(config.type, i + 1, config.data)
      );
      setChartImages(images);
    };

    updateImages();

    // Update chart data and regenerate images periodically
    const interval = setInterval(() => {
      chartDataRef.current = chartDataRef.current.map(config => ({
        ...config,
        data: generateData(config.type === 'pie' ? 5 : 6),
      }));
      updateImages();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-50 overflow-hidden">
      {/* Dome Gallery Background */}
      {chartImages.length > 0 && (
        <DomeGallery
          images={chartImages.map((src, i) => ({
            src,
            alt: `Chart ${i + 1}`
          }))}
          fit={0.6}
          minRadius={500}
          maxRadius={800}
          overlayBlurColor="#f8fafc"
          imageBorderRadius="12px"
          openedImageBorderRadius="12px"
          grayscale={false}
          segments={30}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      )}

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
        <div className="text-center space-y-6 max-w-2xl px-8 pointer-events-auto">
          <div className="inline-block animate-fade-in">
            <h1 className="text-6xl text-slate-900 tracking-tight mb-2">
              DataChat AI
            </h1>
            <div className="h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-full animate-gradient"></div>
          </div>
          
          <p className="text-xl text-slate-600 animate-fade-in-delay">
            Transform your company's data into insights
          </p>
          
          <button
            onClick={onGetStarted}
            className="group relative px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-110 cursor-big shadow-lg hover:shadow-xl mt-8 animate-fade-in-delay-2"
          >
            <span className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <p className="text-sm text-slate-500 mt-4 animate-fade-in-delay-3">
            Drag to explore • Click charts to enlarge
          </p>
        </div>
      </div>

      {/* Custom cursor and animation styles */}
      <style>{`
        .cursor-big {
          cursor: pointer;
        }
        .cursor-big:hover {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1"><circle cx="12" cy="12" r="10"/></svg>') 24 24, pointer;
        }

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

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
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

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
