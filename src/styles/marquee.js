export const marqueeStyle = `
  @keyframes marquee { 
    0% { transform: translateX(100%); } 
    100% { transform: translateX(-100%); } 
  }
  .animate-marquee { 
    display: inline-flex; 
    animation: marquee 25s linear infinite; 
  }
  .animate-marquee:hover { 
    animation-play-state: paused; 
  }
`;
