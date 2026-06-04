// Center panel: tabs + button grid + village census
function MainPanel({ tab, setTab, buildings, onBuild, kittens }) {
  const tabs = ["Bonfire","Village","Science","Workshop","Religion","Trade","Space","Time"];
  return (
    <div className="col-mid">
      <div className="tabs">
        {tabs.map((t,i)=>(
          <React.Fragment key={t}>
            <span className={"tab " + (tab===t?"active":"")} onClick={()=>setTab(t)}>{t}</span>
            {i < tabs.length-1 && <span className="sep">|</span>}
          </React.Fragment>
        ))}
      </div>

      {tab === "Bonfire" && <BonfireTab buildings={buildings} onBuild={onBuild}/>}
      {tab === "Village" && <VillageTab kittens={kittens}/>}
      {tab !== "Bonfire" && tab !== "Village" && (
        <div className="panel" style={{minHeight: 260}}>
          <h1 className="tab-title">{tab}</h1>
          <p style={{color:"var(--ink-2)", fontSize:13}}>
            <em>The {tab.toLowerCase()} tab unlocks later. Keep planting catnip.</em>
          </p>
        </div>
      )}
    </div>
  );
}

function BonfireTab({ buildings, onBuild }) {
  return (
    <div className="panel">
      <h1 className="tab-title">Bonfire</h1>
      <div className="section-title">RESOURCES</div>
      <div className="btn-grid">
        {buildings.filter(b=>b.cat==="res").map(b => <BuildingButton key={b.id} b={b} onClick={()=>onBuild(b.id)}/>)}
      </div>
      <div className="section-title">BUILDINGS</div>
      <div className="btn-grid">
        {buildings.filter(b=>b.cat==="bld").map(b => <BuildingButton key={b.id} b={b} onClick={()=>onBuild(b.id)}/>)}
      </div>
    </div>
  );
}

function BuildingButton({ b, onClick }) {
  const cls = ["kbtn"];
  if (b.disabled) cls.push("disabled");
  if (b.limited) cls.push("limited");
  if (b.on) cls.push("on");
  return (
    <button className={cls.join(" ")} onClick={onClick} title={b.flavor}>
      <span className="name">{b.name}</span>
      {b.count > 0 && <span className="count">{b.count}</span>}
      <span className="price">{b.price}</span>
    </button>
  );
}

function VillageTab({ kittens }) {
  return (
    <div className="panel">
      <h1 className="tab-title">Village</h1>
      <div style={{fontSize:13, color:"var(--ink-2)", marginBottom: 14}}>
        Free kittens: <span style={{color:"var(--sacred)", fontFamily:"var(--font-mono)"}}>{kittens.filter(k=>k.skill==="unassigned").length}</span>
        &nbsp;·&nbsp; Happiness: <span style={{color:"var(--ok)", fontFamily:"var(--font-mono)"}}>112%</span>
      </div>
      <div className="section-title">CENSUS</div>
      <div className="census">
        {kittens.map(k => (
          <div key={k.name} className={"k-card " + (k.leader?"leader":"")}>
            <div className="av" title={k.color}>{k.leader ? "★" : k.glyph}</div>
            <div className="meta">
              <div className="name">{k.leader && <span style={{marginRight:4}}>★</span>}{k.name}</div>
              <div className="info">{k.age} yrs · {k.gender} · {k.trait}</div>
            </div>
            <div className={"skill " + (k.skill==="unassigned"?"unassigned":"")}>{k.skill}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.MainPanel = MainPanel;
