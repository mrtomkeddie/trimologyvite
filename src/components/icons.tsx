export const Icons = {
    logo: (props: React.SVGProps<SVGSVGElement>) => (
        <svg
            {...props}
            viewBox="0 0 500 380"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
        >
            {/* Main flourishes */}
            <path d="M250,170 C 120,170 120,80 20,100 C-20,120 -20,220 40,240 C 120,280 180,210 210,190" />
            <path d="M250,170 C 380,170 380,80 480,100 C 520,120 520,220 460,240 C 380,280 320,210 290,190" />
            
            {/* Shield */}
            <path d="M250,40 C180,40 160,80 160,130 L160,180 C160,220 250,240 250,240 C250,240 340,220 340,180 L340,130 C340,80 320,40 250,40 Z" />
            
            {/* Inner part of shield (black) */}
            <path fill="black" d="M250,50 C190,50 170,85 170,130 L170,175 C170,210 250,225 250,225 C250,225 330,210 330,175 L330,130 C330,85 310,50 250,50 Z" />
            
            {/* Barber pole */}
            <g>
                <path fill="currentColor" d="M242,100 h16 v80 h-16 Z" />
                <circle fill="currentColor" cx="250" cy="92" r="10" />
                <path fill="currentColor" d="M250,188 a8 8 0 1 1 0-0.1" />
                <path fill="black" d="M242 110 L258 100 L258 115 L242 125 Z" />
                <path fill="black" d="M242 135 L258 125 L258 140 L242 150 Z" />
                <path fill="black"d="M242 160 L258 150 L258 165 L242 175 Z" />
            </g>
            
            {/* Text */}
            <text x="50%" y="290" textAnchor="middle" fontFamily="serif" fontSize="50" fontWeight="bold" fill="currentColor">TRIMOLOGY</text>
            <text x="445" y="295" fontFamily="serif" fontSize="12" fontWeight="normal" fill="currentColor">®</text>

            {/* Bottom flourish */}
            <path d="M120,330 C180,350 320,350 380,330 C360,320 300,340 250,340 C200,340 140,320 120,330 Z" />
            
            {/* Underline */}
            <rect x="100" y="310" width="300" height="4" fill="currentColor" />
        </svg>
    ),
  };
