// Atmospheric scene layer drawn behind the UI per era.
// Each scene returns a single <div> wrapper to avoid JSX fragment edge cases.

function Scene({ era }) {
  return (
    <div className="scene-layer" data-scene={era} aria-hidden="true">
      {era === "forest" && <ForestScene/>}
      {era === "iron"   && <IronScene/>}
      {era === "helios" && <HeliosScene/>}
    </div>
  );
}

function ForestScene() {
  return (
    <div className="scene-inner forest">
      <svg className="scene-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        <defs>
          <pattern id="f-canopy" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill="#7DA86A"/>
            <rect x="1" y="1" width="1" height="1" fill="#5E8B47"/>
            <rect x="2" y="2" width="1" height="1" fill="#3F6B2E"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width="800" height="220" fill="url(#f-canopy)"/>
        <rect x="0" y="0" width="800" height="220" fill="rgba(180,210,150,0.3)"/>
        <g opacity="0.3" fill="#A8B89A">
          <rect x="80"  y="180" width="6" height="240"/>
          <rect x="180" y="160" width="5" height="280"/>
          <rect x="290" y="170" width="6" height="260"/>
          <rect x="430" y="155" width="5" height="290"/>
          <rect x="540" y="180" width="6" height="240"/>
          <rect x="660" y="165" width="5" height="270"/>
        </g>
        <g fill="#8B7E5E">
          <rect x="220" y="120" width="14" height="380"/>
          <rect x="500" y="100" width="16" height="400"/>
        </g>
        <g fill="#6B5E3E">
          <rect x="220" y="120" width="3" height="380"/>
          <rect x="500" y="100" width="3" height="400"/>
        </g>
        <g fill="#5E8B47">
          <ellipse cx="225" cy="140" rx="80" ry="50"/>
          <ellipse cx="510" cy="120" rx="100" ry="60"/>
        </g>
        <g fill="#3F6B2E" opacity="0.7">
          <ellipse cx="225" cy="135" rx="60" ry="35"/>
          <ellipse cx="510" cy="115" rx="75" ry="40"/>
        </g>
        <g fill="#3F2E1E">
          <rect x="40"  y="0" width="50" height="600"/>
          <rect x="700" y="0" width="60" height="600"/>
        </g>
        <g fill="#2B1F12">
          <rect x="40"  y="0" width="8" height="600"/>
          <rect x="700" y="0" width="10" height="600"/>
        </g>
        <g fill="#5E4A2E">
          <rect x="82"  y="0" width="8" height="600"/>
          <rect x="750" y="0" width="10" height="600"/>
        </g>
        <rect x="0" y="500" width="800" height="100" fill="#7DA86A"/>
        <rect x="0" y="540" width="800" height="60"  fill="#5E8B47"/>
        <rect x="0" y="580" width="800" height="20"  fill="#3F6B2E"/>
        <g fill="#3F6B2E">
          <rect x="120" y="490" width="40" height="12"/>
          <rect x="370" y="495" width="60" height="14"/>
          <rect x="600" y="488" width="50" height="14"/>
        </g>
        <rect x="0" y="280" width="800" height="120" fill="rgba(245,240,210,0.35)"/>
      </svg>
    </div>
  );
}

function IronScene() {
  return (
    <div className="scene-inner iron">
      <svg className="scene-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        <g fill="#1A1612" opacity="0.85">
          <rect x="50"  y="380" width="80"  height="220"/>
          <rect x="60"  y="320" width="20"  height="60"/>
          <rect x="100" y="340" width="20"  height="40"/>
          <rect x="180" y="400" width="120" height="200"/>
          <rect x="200" y="350" width="14"  height="50"/>
          <rect x="240" y="330" width="18"  height="70"/>
          <rect x="280" y="360" width="14"  height="40"/>
          <rect x="350" y="420" width="100" height="180"/>
          <rect x="500" y="390" width="140" height="210"/>
          <rect x="520" y="320" width="16"  height="70"/>
          <rect x="560" y="300" width="20"  height="90"/>
          <rect x="600" y="340" width="14"  height="50"/>
          <rect x="680" y="410" width="90"  height="190"/>
        </g>
        <ellipse cx="400" cy="600" rx="500" ry="120" fill="#B45A3A" opacity="0.35"/>
        <ellipse cx="240" cy="600" rx="80"  ry="40"  fill="#FF8C3A" opacity="0.5"/>
        <ellipse cx="570" cy="600" rx="100" ry="50"  fill="#FF8C3A" opacity="0.4"/>
        <g fill="#3A332A" opacity="0.5">
          <rect x="60"  y="100" width="30" height="60"/>
          <rect x="50"  y="60"  width="40" height="40"/>
          <rect x="240" y="120" width="28" height="50"/>
          <rect x="560" y="80"  width="32" height="60"/>
          <rect x="550" y="40"  width="42" height="40"/>
        </g>
        <g fill="#1A1612">
          <rect x="0"   y="0" width="20" height="600"/>
          <rect x="780" y="0" width="20" height="600"/>
        </g>
      </svg>
      <div className="ember" style={{ left: "22%", animationDelay: "0s" }}/>
      <div className="ember" style={{ left: "28%", animationDelay: "3s" }}/>
      <div className="ember" style={{ left: "67%", animationDelay: "6s" }}/>
      <div className="ember" style={{ left: "72%", animationDelay: "9s" }}/>
      <div className="ember" style={{ left: "45%", animationDelay: "1.5s" }}/>
    </div>
  );
}

function HeliosScene() {
  return (
    <div className="scene-inner helios">
      <svg className="scene-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
        <circle cx="650" cy="180" r="120" fill="#1A2E6E" opacity="0.7"/>
        <circle cx="650" cy="180" r="120" fill="none" stroke="#14F0D8" strokeWidth="1" opacity="0.6"/>
        <ellipse cx="650" cy="180" rx="180" ry="20" fill="none" stroke="#C23574" strokeWidth="1" opacity="0.5" transform="rotate(-15 650 180)"/>
        <ellipse cx="200" cy="350" rx="280" ry="120" fill="#C23574" opacity="0.12"/>
        <ellipse cx="500" cy="400" rx="240" ry="100" fill="#14F0D8" opacity="0.08"/>
        <g fill="#02050E" stroke="#14F0D8" strokeWidth="0.5" opacity="0.85">
          <rect x="120" y="450" width="180" height="80"/>
          <rect x="500" y="470" width="220" height="60"/>
        </g>
        <g fill="#14F0D8" opacity="0.7">
          <rect x="135" y="465" width="3" height="3"/>
          <rect x="160" y="475" width="3" height="3"/>
          <rect x="195" y="470" width="3" height="3"/>
          <rect x="245" y="465" width="3" height="3"/>
          <rect x="275" y="475" width="3" height="3"/>
        </g>
        <g fill="#C23574" opacity="0.6">
          <rect x="525" y="490" width="3" height="3"/>
          <rect x="565" y="485" width="3" height="3"/>
          <rect x="615" y="495" width="3" height="3"/>
          <rect x="665" y="485" width="3" height="3"/>
          <rect x="705" y="495" width="3" height="3"/>
        </g>
        <rect x="0" y="528" width="800" height="2" fill="#14F0D8" opacity="0.5"/>
        <rect x="0" y="530" width="800" height="70" fill="#02050E"/>
        <g stroke="#14F0D8" strokeWidth="0.5" opacity="0.25" fill="none">
          <line x1="0" y1="540" x2="800" y2="540"/>
          <line x1="0" y1="555" x2="800" y2="555"/>
          <line x1="0" y1="575" x2="800" y2="575"/>
          <line x1="-50" y1="600" x2="350" y2="528"/>
          <line x1="100" y1="600" x2="400" y2="528"/>
          <line x1="700" y1="600" x2="500" y2="528"/>
          <line x1="900" y1="600" x2="550" y2="528"/>
        </g>
      </svg>
    </div>
  );
}
