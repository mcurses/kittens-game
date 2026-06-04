// Resource ledger — left column
function ResourceLedger({ resources, fastActions, onFast }) {
  const groups = [
    { title: "FOOD",      keys: ["catnip"] },
    { title: "MATERIAL",  keys: ["wood","minerals","coal","iron","gold"] },
    { title: "SACRED",    keys: ["faith","culture"] },
    { title: "SCIENCE",   keys: ["science","manuscript"] },
    { title: "EXOTIC",    keys: ["unobtainium","antimatter"] },
  ];

  function fmt(n) {
    if (n == null) return "-";
    if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
    if (n >= 1e3) return (n/1e3).toFixed(2)+"K";
    if (n >= 10)  return n.toFixed(0);
    return n.toFixed(2);
  }

  return (
    <div className="panel">
      <div className="panel-title">Resources <span className="toggle" title="collapse">·</span></div>
      <div className="ledger">
        {groups.map(g => {
          const rows = g.keys.filter(k => resources[k]).map(k => resources[k]);
          if (rows.length === 0) return null;
          return (
            <React.Fragment key={g.title}>
              <div className="group-head">{g.title}</div>
              {rows.map(r => (
                <div key={r.name} className={"row " + (r.warn ? "warn" : "")}>
                  <span className="name" style={{color: r.color}}>{r.name}</span>
                  <span className="val">{fmt(r.value)}{r.max ? <span className="max"> / {fmt(r.max)}</span> : null}</span>
                  <span className={"rate " + (r.rate < 0 ? "neg" : "")}>{r.rate>=0?"+":""}{r.rate.toFixed(2)}</span>
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
      <div className="fast-actions">
        {fastActions.map(a => (
          <a key={a.id} onClick={()=>onFast(a.id)}>
            {a.label} <span className="qty">({a.qty} times)</span>
          </a>
        ))}
      </div>
    </div>
  );
}
window.ResourceLedger = ResourceLedger;
