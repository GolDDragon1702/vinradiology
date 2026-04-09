import React from "react";

interface VinmecLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const VinmecLogo: React.FC<VinmecLogoProps> = ({ className = "", size = 32, color = "currentColor" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stylized bird/leaf — inspired by Vinmec's upward-flying bird */}
      <path
        d="M32 4C28 12 18 22 12 30C8 36 6 42 10 48C14 54 22 56 28 54C30 53 31 52 32 50C33 52 34 53 36 54C42 56 50 54 54 48C58 42 56 36 52 30C46 22 36 12 32 4Z"
        fill={color}
      />
      <path
        d="M32 18C30 24 26 30 24 36C22 40 22 44 26 46C28 47 30 47 32 45C34 47 36 47 38 46C42 44 42 40 40 36C38 30 34 24 32 18Z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
};

export default VinmecLogo;
