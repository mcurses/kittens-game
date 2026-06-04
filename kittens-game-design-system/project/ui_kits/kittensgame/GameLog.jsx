// Game log column — calendar, intro, log entries
function GameLog({ season, year, entries, onClear }) {
  const seasonGlyph = { Spring: "🌱", Summer: "☀", Autumn: "🍂", Winter: "❄" }[season] || "·";
  return (
    <div className="panel log-wrap">
      <div className="calendar"><span className="sign">{seasonGlyph}</span>{season}, year {year}</div>
      <div className="right-tab-header">
        <a className="active">Log</a><span className="sep">|</span>
        <a>Queue</a>
      </div>
      <div className="intro">You are a kitten in a catnip forest.</div>
      <div className="controls">
        <a onClick={onClear}>clear log</a>
        <a>[+] log filters</a>
        <a>pawse</a>
        <a>undo</a>
      </div>
      <div className="log-list">
        {entries.map((e,i) => {
          if (e.type === "date") return <div key={i} className="date">{e.text}</div>;
          return <div key={i} className={"msg " + (e.type||"")}>{e.text}</div>;
        })}
      </div>
    </div>
  );
}
window.GameLog = GameLog;
