// Top bar — title, status pings, save/options links, era toggle
function TopBar({ era, setEra, happiness, energy, kittens, time }) {
  return (
    <div className="topbar">
      <div className="title">
        <img src="../../assets/cat.svg" width="32" height="32" alt="" />
        <span>KITTENS GAME</span>
        <span className="by">a Dark Souls of incremental gaming</span>
      </div>
      <div className="stat" title="Kittens"><span className="glyph">★</span><span className="v">{kittens}</span></div>
      <div className="stat happiness" title="Happiness"><span className="glyph">☺</span><span className="v">{happiness}%</span></div>
      <div className={"stat energy " + (energy < 0 ? "warn" : "")} title="Energy">
        <span className="glyph">⚡</span><span className="v">{energy >= 0 ? `+${energy}` : energy}</span>
      </div>
      <div className="stat" title="Year"><span className="glyph">☀</span><span className="v">y. {time}</span></div>
      <div className="spacer"></div>
      <div className="era-toggle" title="Switch era preview">
        {["forest","iron","helios"].map(e => (
          <button key={e} className={era===e?"active":""} onClick={()=>setEra(e)}>{e.toUpperCase()}</button>
        ))}
      </div>
      <div className="links">
        <a>save</a><span className="sep">|</span>
        <a>options</a><span className="sep">|</span>
        <a>reset</a><span className="sep">|</span>
        <a>wipe</a>
      </div>
    </div>
  );
}
window.TopBar = TopBar;
