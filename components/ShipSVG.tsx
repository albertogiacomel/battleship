import React from 'react';

interface ShipSVGProps {
  shipId: string;
  orientation?: 'horizontal' | 'vertical';
  isSunk?: boolean;
  className?: string;
}

const ShipSVG: React.FC<ShipSVGProps> = ({ shipId, orientation = 'horizontal', isSunk = false, className }) => {
  const isVertical = orientation === 'vertical';
  
  const baseColor = isSunk ? "#3f2e22" : "#475569"; // Rust brown vs Slate
  const highlightColor = isSunk ? "#2b1d16" : "#64748b";
  const stroke = isSunk ? "#271c19" : "#94a3b8";
  const accentColor = isSunk ? "#451a03" : "#0ea5e9";

  // Common defs for rust texture if sunk
  const svgDefs = isSunk ? (
    <defs>
      <pattern id={`rustPattern-${shipId}`} patternUnits="userSpaceOnUse" width="10" height="10">
         <rect width="10" height="10" fill={baseColor} />
         <circle cx="2" cy="2" r="1" fill="#000" opacity="0.2" />
         <circle cx="7" cy="8" r="1.5" fill="#000" opacity="0.3" />
      </pattern>
    </defs>
  ) : null;
  
  const fillBase = isSunk ? `url(#rustPattern-${shipId})` : baseColor;

  // Helper group to handle rotation
  const ShipGroup: React.FC<{ width: number, height: number, children: React.ReactNode }> = ({ width, height, children }) => {
    return (
      <g transform={isVertical ? `translate(${height}, 0) rotate(90)` : undefined}>
        {children}
      </g>
    );
  };

  switch (shipId) {
    case 'carrier':
      return (
        <svg 
          viewBox={isVertical ? "0 0 100 500" : "0 0 500 100"} 
          className={className} 
          preserveAspectRatio="none"
        >
          {svgDefs}
          <ShipGroup width={500} height={100}>
            {/* Water wake effect */}
            {!isSunk && (
              <path d="M 10,95 Q 50,85 100,95 T 200,95 T 300,95 T 400,95 T 490,95" 
                    fill="none" stroke="#0ea5e9" strokeWidth="2" opacity="0.4" />
            )}
            <path d="M 25,12 L 475,12 L 490,50 L 475,88 L 25,88 L 10,50 Z" 
                  fill={fillBase} stroke={stroke} strokeWidth="2" />
            <path d="M 30,15 L 470,15 L 483,50 L 470,85 L 30,85 L 17,50 Z" 
                  fill={highlightColor} opacity="0.5" />
            <rect x="35" y="45" width="430" height="10" rx="2" 
                  fill={isSunk ? "#1c1917" : "#1e293b"} />
            <line x1="50" y1="50" x2="450" y2="50" 
                  stroke={isSunk ? "#444" : "#fbbf24"} strokeWidth="3" strokeDasharray="25,12" />
            <path d="M 360,55 L 420,55 L 430,85 L 350,85 Z" 
                  fill={isSunk ? "#1c1917" : "#334155"} stroke={stroke} strokeWidth="1" />
            <rect x="375" y="35" width="30" height="20" rx="3" 
                  fill={isSunk ? "#1c1917" : "#475569"} />
            <circle cx="390" cy="18" r="4" fill={accentColor} />
          </ShipGroup>
        </svg>
      );

    case 'battleship':
      return (
        <svg 
          viewBox={isVertical ? "0 0 100 400" : "0 0 400 100"} 
          className={className} 
          preserveAspectRatio="none"
        >
          {svgDefs}
          <ShipGroup width={400} height={100}>
            {!isSunk && (
              <path d="M 5,50 Q 15,40 20,50 Q 15,60 5,50" fill="#0ea5e9" opacity="0.3" />
            )}
            <path d="M 35,18 Q 5,50 35,82 L 375,82 Q 395,50 375,18 Z" 
                  fill={fillBase} stroke={stroke} strokeWidth="2" />
            <path d="M 40,22 Q 15,50 40,78 L 370,78 Q 385,50 370,22 Z" 
                  fill={highlightColor} opacity="0.4" />
            <g fill={isSunk ? "#1c1917" : "#1e293b"} stroke={stroke} strokeWidth="1">
              <circle cx="90" cy="50" r="18" />
              <circle cx="310" cy="50" r="18" />
              {!isSunk && (
                <>
                  <rect x="85" y="25" width="10" height="20" fill="#334155" />
                  <rect x="305" y="25" width="10" height="20" fill="#334155" />
                </>
              )}
            </g>
            <path d="M 180,35 L 240,35 L 250,65 L 170,65 Z" 
                  fill={isSunk ? "#1c1917" : "#334155"} stroke={stroke} strokeWidth="1" />
          </ShipGroup>
        </svg>
      );

    case 'submarine':
      return (
        <svg 
          viewBox={isVertical ? "0 0 100 300" : "0 0 300 100"} 
          className={className} 
          preserveAspectRatio="none"
        >
          {svgDefs}
          <ShipGroup width={300} height={100}>
            <rect x="125" y="15" width="50" height="70" rx="12" 
                  fill={isSunk ? "#1c1917" : "#334155"} stroke={stroke} strokeWidth="2" />
            <line x1="150" y1="15" x2="150" y2="5" stroke={stroke} strokeWidth="3" />
            <rect x="145" y="2" width="10" height="6" fill={accentColor} />
            <path d="M 40,25 Q 10,50 40,75 L 260,75 Q 290,50 260,25 Z" 
                  fill={fillBase} stroke={stroke} strokeWidth="2" />
            <path d="M 50,35 Q 30,50 50,65 L 250,65 Q 270,50 250,35 Z" 
                  fill={highlightColor} opacity="0.3" />
            <ellipse cx="275" cy="50" rx="8" ry="15" fill={isSunk ? "#1c1917" : "#1e293b"} />
          </ShipGroup>
        </svg>
      );

    case 'cruiser':
      return (
        <svg 
          viewBox={isVertical ? "0 0 100 300" : "0 0 300 100"} 
          className={className} 
          preserveAspectRatio="none"
        >
          {svgDefs}
          <ShipGroup width={300} height={100}>
            <path d="M 25,22 L 275,22 L 290,50 L 275,78 L 25,78 L 10,50 Z" 
                  fill={fillBase} stroke={stroke} strokeWidth="2" />
            <path d="M 30,28 L 270,28 L 282,50 L 270,72 L 30,72 L 18,50 Z" 
                  fill={highlightColor} opacity="0.4" />
            <g fill={isSunk ? "#1c1917" : "#1e293b"} stroke={stroke} strokeWidth="1">
              <rect x="55" y="38" width="35" height="24" rx="3" />
              <circle cx="72" cy="50" r="10" />
            </g>
            <path d="M 130,30 L 170,30 L 175,60 L 125,60 Z" 
                  fill={isSunk ? "#1c1917" : "#334155"} />
          </ShipGroup>
        </svg>
      );

    case 'destroyer':
      return (
        <svg 
          viewBox={isVertical ? "0 0 100 200" : "0 0 200 100"} 
          className={className} 
          preserveAspectRatio="none"
        >
          {svgDefs}
          <ShipGroup width={200} height={100}>
            <path d="M 25,28 L 175,28 L 190,50 L 175,72 L 25,72 L 10,50 Z" 
                  fill={fillBase} stroke={stroke} strokeWidth="2" />
            <path d="M 30,35 L 170,35 L 180,50 L 170,65 L 30,65 L 20,50 Z" 
                  fill={highlightColor} opacity="0.4" />
            <rect x="50" y="40" width="25" height="20" rx="2" 
                  fill={isSunk ? "#1c1917" : "#1e293b"} stroke={stroke} strokeWidth="1" />
            <path d="M 100,38 L 130,38 L 135,62 L 95,62 Z" 
                  fill={isSunk ? "#1c1917" : "#334155"} />
          </ShipGroup>
        </svg>
      );

    default:
      return <div className="w-full h-full bg-slate-600 rounded" />;
  }
};

export default ShipSVG;