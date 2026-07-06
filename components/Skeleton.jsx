'use client';

export default function Skeleton({ width = '100%', height = '20px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#e0e0e0',
        backgroundImage: 'linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
        ...style
      }}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
