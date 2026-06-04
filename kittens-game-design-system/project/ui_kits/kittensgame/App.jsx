// Main app — wires everything together with fake interactive state.
const { useState, useEffect, useRef } = React;

const INITIAL_RESOURCES = {
  catnip:    { name: "catnip",    color: "#5E8B47", value: 1240, max: 5000, rate: 0.62 },
  wood:      { name: "wood",      color: "#8B5A2B", value: 486,  max: 2000, rate: 0.12 },
  minerals:  { name: "minerals",  color: "#847266", value: 2100, max: 5000, rate: 0.05 },
  coal:      { name: "coal",      color: "#1A1A1A", value: 73,   max: 200,  rate: 0.01 },
  iron:      { name: "iron",      color: "#6E6155", value: 152,  max: 400,  rate: -0.02, warn: false },
  gold:      { name: "gold",      color: "#D9A441", value: 8,    max: 50,   rate: 0.01 },
  faith:     { name: "faith",     color: "#C23574", value: 340,  max: 1000, rate: 0.18 },
  culture:   { name: "culture",   color: "#A37BD9", value: 18,   max: 100,  rate: 0.04 },
  science:   { name: "science",   color: "#7A9DC2", value: 12400, max: 28000, rate: 0.83 },
  manuscript:{ name: "manuscript",color: "#9E8E5E", value: 4,    max: null, rate: 0 },
};

const BUILDINGS = [
  { id: "field",    cat: "res", name: "Catnip field",    price: "10 catnip",  count: 12, on: false, flavor: "Plant catnip to grow it in the village." },
  { id: "pasture",  cat: "res", name: "Pasture",         price: "100 catnip", count: 4,  on: false, flavor: "Kittens need food, but a pasture reduces consumption." },
  { id: "aqueduct", cat: "res", name: "Aqueduct",        price: "75 minerals",count: 1,  on: false, limited: false },
  { id: "hut",      cat: "bld", name: "Hut",             price: "5 wood",     count: 3,  on: false, flavor: "Provides housing for two kittens." },
  { id: "logHouse", cat: "bld", name: "Log house",       price: "200 wood",   count: 1,  on: false },
  { id: "library",  cat: "bld", name: "Library",         price: "25 wood",    count: 2,  on: false, flavor: "+8 max science." },
  { id: "academy",  cat: "bld", name: "Academy",         price: "70 wood, 50 minerals", count: 1, on: false, disabled: true },
  { id: "smelter",  cat: "bld", name: "Smelter",         price: "200 minerals", count: 0, on: false, limited: true, flavor: "Turns minerals into iron." },
  { id: "calciner", cat: "bld", name: "Calciner",        price: "120 stone, 15 titanium", count: 0, on: false, disabled: true },
];

const KITTENS = [
  { name: "Mira",   age: 23, gender: "♀", trait: "Calm",     glyph: "🐈", color: "tabby cream",  skill: "engineer", leader: true },
  { name: "Pip",    age: 14, gender: "♂", trait: "Bold",     glyph: "🐈", color: "black",        skill: "scholar" },
  { name: "Tarn",   age: 9,  gender: "♂", trait: "Curious",  glyph: "🐈", color: "calico",       skill: "unassigned" },
  { name: "Lumen",  age: 17, gender: "♀", trait: "Wise",     glyph: "🐈", color: "white",        skill: "priest" },
  { name: "Ash",    age: 11, gender: "♂", trait: "Stubborn", glyph: "🐈", color: "fawn",         skill: "hunter" },
  { name: "Velv",   age: 6,  gender: "♀", trait: "Manager",  glyph: "🐈", color: "torbie",       skill: "manager" },
];

const FAST_ACTIONS = [
  { id: "hunt",    label: "Send hunters",    qty: 3 },
  { id: "praise",  label: "Praise the sun!", qty: 1 },
];

const INITIAL_LOG = [
  { type: "date", text: "Spring, year 12" },
  { type: "",        text: "A kitten has joined your village." },
  { type: "notice",  text: "Catnip surplus reached." },
  { type: "important", text: "Winter is coming." },
  { type: "date", text: "Summer, year 12" },
  { type: "",        text: "Hunters return with 14 furs and 6 ivory." },
  { type: "alert",   text: "Your kittens are starving!" },
  { type: "notice",  text: "You learned: Mining." },
  { type: "urgent",  text: "Embassy established with the Lizards." },
];

function App() {
  const [era, setEra] = useState("forest");
  const [tab, setTab] = useState("Bonfire");
  const [resources, setResources] = useState(INITIAL_RESOURCES);
  const [log, setLog] = useState(INITIAL_LOG);
  const [buildings, setBuildings] = useState(BUILDINGS);

  // Apply era to body
  useEffect(() => { document.body.setAttribute("data-era", era); }, [era]);

  // tick — increment resources by their rate every 1s
  useEffect(() => {
    const t = setInterval(() => {
      setResources(prev => {
        const next = {};
        for (const k in prev) {
          const r = prev[k];
          let v = r.value + r.rate;
          if (r.max != null) v = Math.min(v, r.max);
          v = Math.max(0, v);
          next[k] = { ...r, value: v };
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function onBuild(id) {
    setBuildings(bs => bs.map(b => b.id === id && !b.disabled
      ? { ...b, count: (b.count||0) + 1, limited: false }
      : b));
    const b = buildings.find(x => x.id === id);
    if (b && !b.disabled) {
      setLog(l => [...l, { type: "notice", text: `Built ${b.name.toLowerCase()}.` }]);
    }
  }
  function onFast(id) {
    if (id === "hunt") setLog(l => [...l, { type: "", text: "Hunters return with furs." }]);
    if (id === "praise") setLog(l => [...l, { type: "notice", text: "You praised the sun. (+8 faith)" }]);
  }
  function onClear() { setLog([{ type: "date", text: "Spring, year 12" }]); }

  return (
    <>
      <Scene era={era}/>
      <TopBar
        era={era} setEra={setEra}
        happiness={112}
        energy={era === "helios" ? 8 : -2}
        kittens={KITTENS.length}
        time={12}
      />
      <div className="app">
        <div className="col col-left">
          <ResourceLedger resources={resources} fastActions={FAST_ACTIONS} onFast={onFast} />
        </div>
        <div className="col col-mid">
          <MainPanel tab={tab} setTab={setTab} buildings={buildings} onBuild={onBuild} kittens={KITTENS}/>
        </div>
        <div className="col col-right">
          <GameLog season="Summer" year={12} entries={log} onClear={onClear}/>
        </div>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
