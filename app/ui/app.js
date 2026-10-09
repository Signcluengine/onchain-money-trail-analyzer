// Ferret desktop window. Renders the case views and exposes window.ferret,
// which the shell (and the README capture scripts) use to drive it.
(() => {
  const CASE = {
    id: '0031',
    title: 'Investment platform',
    input: '89979c774a360bf9f89cc67d1771da831a7fd419a1d7e420ffe8ff0a752eb1ca',
    victim: 'TXv41X8qSAk398bFnq9Ap3j49FboVaJd2q',
    total: 12400,
    hops: [
      { n: 1, text: '<b>Two payments to one wallet</b>', tag: ['red', 'Reported as a scam 14 times'], rows: [
        { id: 'r1', t: '08:14:09', ch: 'TRON', to: 'Collector', addr: 'TQ7mTEe682rySNDENSQfGEoETejc44x9Fd', amt: 7400, tx: '89979c774a360bf9f89cc67d1771da831a7fd419a1d7e420ffe8ff0a752eb1ca' },
        { id: 'r2', t: '08:52:41', ch: 'TRON', to: 'Collector', addr: 'TQ7mTEe682rySNDENSQfGEoETejc44x9Fd', amt: 5000, tx: 'c6d71e1dec4ad782e14964ce78aada8eda257853398ed623affb4df418aa91a3' },
      ] },
      { n: 2, text: '<b>Split eleven minutes later</b>', rows: [
        { id: 'r3', t: '09:03:17', ch: 'TRON', to: 'Wallet', addr: 'TFz2vCP9EAvsR26paxVitEEsUoQDNik3Lp', amt: 10500, tx: '75849cea82544f4de55e4bcf6fa0fb64f9563efb42952301b572bdd919c323c5' },
        { id: 'r4', t: '09:03:52', ch: 'TRON', to: 'Wallet', addr: 'TLb8uFX3HNKNdSXiivMEp7srLzCcgbQe4r', amt: 1900, tx: '951b24c93a77fbdd5807604386f7be59eb78b8eac6dd10eafd2ef0071c9c82e7' },
      ] },
      { n: 3, text: '<b>Bridged to Ethereum</b>, part sent to a mixer', rows: [
        { id: 'r5', t: '09:11:05', ch: 'TRON>ETH', to: 'Bridge to', addr: '0x5c1ebf13f4f08ffb703c9e514316695ec76ea9f2', amt: 9850, tx: '5e7c5f748a18830cc1e3e3ec952ab59b84348226f19e6831c1116483e22224ac' },
        { id: 'r6', t: '09:20:44', ch: 'TRON', to: 'Mixer', addr: 'TMx3vkK6CD2sfQm7jSKLivyD8WDtNV7HwA', amt: 1900, tag: ['amber', 'Mixer'], tx: '9a3b15df7f701b7741e43cb28fa9cb3c14b0473f46b6a088cc9b6a62da847e21' },
        { id: 'r7', t: '', ch: 'TRON', to: 'Not moved, still in', addr: 'TFz2vCP9EAvsR26paxVitEEsUoQDNik3Lp', amt: 650, quiet: true },
      ] },
      { n: 4, text: '<b>Landed at an exchange</b>', tag: ['green', 'Exchange deposit'], rows: [
        { id: 'r8', t: '09:33:58', ch: 'ETH', to: 'Kestrel Exchange', addr: '0x8d039ea4b3b69c513d647c96d97811f886db41be', amt: 9850, mark: true, tx: '9ba88bd06ea29abc0c10296ddfda531726c2df8537dbd18850a3ac4b690d5e59' },
      ] },
    ],
    ends: [
      { id: 'kestrel', color: 'var(--green)', name: 'Kestrel Exchange', pct: 79, amt: 9850, what: 'Deposit address', note: 'The exchange knows who owns this account and can freeze it when the police ask.', key: true },
      { id: 'mixer', color: 'var(--amber)', name: 'Mixer', pct: 15, amt: 1900, what: 'Harder to follow from here' },
      { id: 'still', color: 'var(--faint)', name: 'Still in a wallet', pct: 5, amt: 650, what: 'Watch tells you if it moves' },
    ],
  };

  const short = (a) => (a.startsWith('0x') ? a.slice(0, 6) : a.slice(0, 4)) + '…' + a.slice(-4);
  const money = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ARROW = '<svg viewBox="0 0 12 12"><path d="M1.5 6h8.5M7 3l3 3-3 3"/></svg>';
  const ic = (d) => `<svg class="i" viewBox="0 0 16 16">${d}</svg>`;
  const I = {
    trace: ic('<path d="M3 3v4.5a2.5 2.5 0 0 0 2.5 2.5H13M10 7l3 3-3 3"/>'),
    report: ic('<path d="M4 1.8h5.5L12.5 5v9.2H4z"/><path d="M9.3 1.8V5h3.2M6.2 8.3h4M6.2 10.8h4"/>'),
    eye: ic('<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.8"/>'),
    shield: ic('<path d="M8 1.6 13 3.4v4.2c0 3.2-2.2 5.6-5 6.8-2.8-1.2-5-3.6-5-6.8V3.4z"/><path d="M5.8 8.1 7.4 9.7l3-3.2"/>'),
    link: ic('<path d="M6.6 9.4 9.4 6.6M7.1 4.3l1-1a2.5 2.5 0 0 1 3.6 3.6l-1 1M8.9 11.7l-1 1a2.5 2.5 0 0 1-3.6-3.6l1-1"/>'),
    clock: ic('<circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.4"/>'),
    lock: ic('<rect x="3.2" y="7" width="9.6" height="7" rx="1.5"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7"/>'),
    check: ic('<path d="m3.5 8.5 3 3 6-7"/>'),
    no: ic('<path d="m4.5 4.5 7 7M11.5 4.5l-7 7"/>'),
    pdf: ic('<path d="M8 2v8.5M4.8 7.5 8 10.7l3.2-3.2M3 13.5h10"/>'),
    copy: ic('<rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>'),
    close: ic('<path d="m4 4 8 8M12 4l-8 8"/>'),
  };

  // The F mark: an ink stroke, and a highlighter stroke behind it.
  const LOGO = `<svg viewBox="0 0 24 24"><path d="M7.4 12.6h11.2l-.9 3.6H6.6z" fill="#ffe066"/><path d="M6 3.6h12.6v4.2H10.4v12.6H6z" fill="#111318"/></svg>`;

  const rowsFlat = CASE.hops.flatMap((h) => h.rows);

  function chainCell(ch) {
    if (ch === 'TRON>ETH') return `TRON${ARROW}ETH`;
    return ch === 'ETH' ? 'ETHEREUM' : ch;
  }

  function statement() {
    let html = `<div class="head"><span class="g"></span><span>Time</span><span>Chain</span><span>To</span><span class="r">USDT</span></div>`;
    for (const h of CASE.hops) {
      html += `<div class="hop" data-hop="${h.n}"><span class="t"><span class="mono">Hop ${h.n}</span><span>${h.text}</span>${h.tag ? `<span class="tag ${h.tag[0]}">${h.tag[1]}</span>` : ''}</span></div>`;
      for (const r of h.rows) {
        html += `<div class="row${r.quiet ? ' quiet' : ''}" data-id="${r.id}"><span></span><span class="tm">${r.t || '—'}</span><span class="ch">${chainCell(r.ch)}</span>
          <span class="to"><b>${r.to}</b><span class="mono">${short(r.addr)}</span>${r.tag ? `<span class="tag ${r.tag[0]}">${r.tag[1]}</span>` : ''}</span>
          <span class="amt">${r.mark ? `<span class="mark" id="markAmt">${money(r.amt)}</span>` : money(r.amt)}</span></div>`;
      }
    }
    return `<div class="st" id="st">${html}<svg class="flow" id="flow"></svg></div>`;
  }

  function ends() {
    return CASE.ends.map((e) => `<div class="end${e.key ? ' key' : ''}" data-end="${e.id}">
      <div class="top"><i style="background:${e.color}"></i>${e.name}<span class="pct">${e.pct}%</span></div>
      <div class="what">${e.what} · <span class="mono">${money(e.amt, 0)} USDT</span></div>
      <div class="track"><b style="background:${e.color}" data-w="${e.pct}"></b></div>
      ${e.note ? `<div class="note">${e.note}</div>` : ''}</div>`).join('');
  }

  const CLUES = [
    { text: 'The collector address is shown on the deposit page of <span class="mono">apex-yieldhub.io</span>.', src: 'Web page', date: 'Archived 19 Oct 2026', conf: 'High' },
    { text: 'The collector was reported 14 times as an “investment platform” since 28 Sep 2026. Reported losses add up to 61,300 USDT.', src: 'Chainabuse reports', date: 'Checked 30 Oct 2026', conf: 'High' },
    { text: '<span class="mono">0x5c1e…a9f2</span>, which received the bridged money, has the ENS name <span class="mono">yieldhub-ops.eth</span>.', src: 'ENS reverse record', date: 'Block 23,481,902', conf: 'High' },
    { text: 'The platform’s support account uses an NFT as its avatar. The NFT is held by <span class="mono">0x5c1e…a9f2</span>.', src: 'Public profile and NFT owner', date: 'Archived 30 Oct 2026', conf: 'Medium' },
    { text: '<span class="mono">apex-yieldhub.io</span> was registered 34 days before your first payment.', src: 'RDAP', date: 'Registered 17 Sep 2026', conf: 'High' },
  ];

  function render(root) {
    root.innerHTML = `<div class="win home-on" id="win">
  <header class="tb">
    <span class="brand">${LOGO}Ferret</span>
    <span class="crumb"><span class="mono">Case ${CASE.id}</span>${CASE.title}</span>
    <nav class="tabs" id="tabs"><button data-tab="case" class="on">Money trail</button><button data-tab="clues">Clues <span class="n">5</span></button><button data-tab="report">Report</button></nav>
    <span class="right"><span class="tool" id="shieldBtn">${I.shield}Recovery-scam shield</span>
      <span class="ctl"><span><svg viewBox="0 0 10 10"><path d="M0 5.5h10"/></svg></span><span><svg viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9"/></svg></span><span><svg viewBox="0 0 10 10"><path d="M0 0l10 10M10 0L0 10"/></svg></span></span></span>
  </header>
  <div class="views">
    <section class="view home on" id="home"><div class="col">
      <h1>Find where your crypto went.</h1>
      <p class="sub">Paste a wallet address or a transaction hash. Ferret follows the money, hop by hop, and shows you who can freeze it.</p>
      <div class="field" id="homeField"><span class="val" id="homeVal" data-ph="Wallet address or transaction hash"></span><span class="chip hide" id="homeChip">TRON transaction</span><button class="btn" id="traceBtn">${I.trace}Trace</button></div>
      <div class="chains"><span>Bitcoin</span><span>Ethereum and EVM chains</span><span>TRON</span><span>BNB Chain</span><span>Solana</span></div>
      <div class="recent"><h4>Recent cases</h4>
        <div class="rc"><span class="mono">Case 0030</span><span>Fake job offer</span><span class="amt">2,300 USDT</span><span class="tag green">At an exchange</span></div>
        <div class="rc"><span class="mono">Case 0029</span><span>Romance scam</span><span class="amt">0.42 BTC</span><span class="tag grey">Watching</span></div>
      </div></div>
      <div class="promise">Free, and it runs on your PC. Ferret never asks you for money.</div>
    </section>

    <section class="view case" id="case">
      <div class="main">
        <div class="field"><span class="val">${CASE.input}</span><span class="chip">TRON transaction</span><button class="btn">${I.trace}Trace</button></div>
        <div class="hd tracing" id="hd">
          <div class="busy"><div class="meta"><span id="busyMeta">Tracing</span></div><h1>Following ${money(CASE.total, 0)} USDT…</h1>
            <div class="bar"><i id="busyBar"></i></div><div class="now" id="busyNow">Reading the first transaction</div></div>
          <div class="done"><div class="meta"><span>Traced in 11 s</span><i></i><span>4 hops</span><i></i><span>8 transfers</span><i></i><span>TRON and Ethereum</span></div>
            <h1><span class="mark off" id="markHead">79% of it</span> reached an exchange.</h1>
            <p>9,850 USDT landed in a deposit address at Kestrel Exchange 41 minutes after your last payment. Exchanges can freeze funds when the police ask.</p>
            <div class="acts"><button class="btn" id="reportBtn">${I.report}Make the report</button><button class="btn ghost">${I.eye}Watch these funds</button></div></div>
        </div>
        ${statement()}
      </div>
      <aside class="side tracing" id="side">
        <div class="tracing-only"><h3>Tracing</h3><div class="sub">Every hop is saved as it is found.</div>
          <div class="counts"><div>Transfers<span class="mono" id="cTx">0</span></div><div>Wallets<span class="mono" id="cW">0</span></div><div>Chains<span class="mono" id="cCh">1</span></div><div>Labels checked<span class="mono" id="cL">0</span></div></div></div>
        <div class="done-only"><h3>Where it landed</h3><div class="sub">${money(CASE.total, 0)} USDT followed to the end</div>
          <div class="ends">${ends()}</div>
          <div class="cluecard pending" id="clueCard"><span class="n">5</span>public clues about who runs the collector<a>Open</a></div></div>
        <div class="promise-note"><b>Ferret never asks for money.</b> Anyone who charges a fee to get crypto back is almost certainly running a scam.</div>
      </aside>
    </section>

    <section class="view clues" id="clues">
      <div class="main">
        <h2>Public clues</h2>
        <p class="lede">About the collector <span class="mono">TQ7m…x9Fd</span> and the wallets it paid. Every clue links to a saved copy of its source.</p>
        ${CLUES.map((c, i) => `<div class="clue"><span class="no">${i + 1}</span><div><p>${c.text}</p>
          <div class="src"><span>${I.link}${c.src}</span><span>${I.clock}${c.date}</span><span class="saved">${I.lock}Proof saved</span></div></div>
          <div class="conf">Confidence<b>${c.conf}</b></div></div>`).join('')}
      </div>
      <aside class="side guide">
        <h3>What clues are for</h3>
        <p>These clues point to the people running <span class="mono">apex-yieldhub.io</span>, not to a named person. They help the police and the exchange connect the dots faster.</p>
        <div class="rule"><b>Give them to the police. Don’t post them.</b>Public accusations can hit the wrong person and warn the people you are after.</div>
        <ul><li>${I.check}Public pages and on-chain records only</li><li>${I.check}A saved copy and a time for every clue</li><li class="no">${I.no}No home addresses or phone numbers</li><li class="no">${I.no}Nothing behind a login</li></ul>
        <div class="promise-note"><b>Labels can be wrong.</b> That is why every clue shows its source and how sure Ferret is.</div>
      </aside>
    </section>

    <section class="view shield" id="shield">
      <div class="main">
        <h2>Someone offering to get your money back?</h2>
        <p class="lede">Paste their website, wallet or handle. Ferret checks it against public reports before you reply.</p>
        <div class="field" id="shieldField"><span class="val" id="shieldVal" data-ph="Website, wallet or handle"></span><button class="btn">${I.shield}Check</button></div>
        <div class="verdict pending" id="verdict"><span class="tag red">Recovery scam</span><h3>This looks like a recovery scam.</h3>
          ${[
            ['The site was registered 11 days ago.', 'RDAP · registered 19 Oct 2026'],
            ['It has been reported 23 times as a fake recovery service.', 'Chainabuse reports · latest 29 Oct 2026'],
            ['The wallet it asks you to pay received money from 41 different people in October.', 'TRON · TRk9…u5Ze'],
            ['It says it works with the police. The police don’t send victims to paid recovery firms.', 'Site text · archived 30 Oct 2026'],
          ].map(([p, s], i) => `<div class="reason pending"><span class="no">${i + 1}</span><div><p>${p}</p><div class="src">${s}</div></div></div>`).join('')}
        </div>
      </div>
      <aside class="side">
        <h3>The rule</h3>
        <div class="big">Never pay a fee to get crypto back.</div>
        <p>No tool and no firm can reverse a blockchain transfer. Exchanges and token issuers freeze funds when the police ask, and that costs you nothing.</p>
        <div class="cite"><b>FBI warning PSA I-081325-PSA</b> (13 Aug 2025) describes fake law firms that promise to trace and recover crypto for a fee. The FTC gives the same advice: never pay upfront.</div>
        <div class="promise-note"><b>Got contacted?</b> Stop replying, keep the messages, and add the site to your police report.</div>
      </aside>
    </section>
  </div>

  <div class="sheet-wrap" id="sheetWrap">
    <div class="sheetbar"><span class="ttl">Report for the police and the exchange</span><button class="btn">${I.pdf}Save PDF</button><button class="btn ghost">${I.copy}Copy text</button><button class="btn ghost">${I.close}</button></div>
    <div class="sheet"><div class="doc">
      <div class="lh">${LOGO}Crypto fraud report<span class="mono">Case ${CASE.id}</span></div>
      <h1>Investment platform scam, 12,400 USDT</h1>
      <dl class="facts"><dt>Prepared</dt><dd>30 Oct 2026, 10:12 UTC</dd>
        <dt>Victim address</dt><dd class="mono">${CASE.victim} (TRON)</dd>
        <dt>Police reference</dt><dd><span class="ref">Add the number the police gave you</span></dd></dl>
      <h5>Summary</h5>
      <p>On 21 Oct 2026 the victim sent 12,400 USDT in two payments to a wallet reported 14 times as a scam. Within 41 minutes, <span class="mark">9,850 USDT reached a deposit address at Kestrel Exchange</span> through a TRON to Ethereum bridge. 1,900 USDT went to a mixer. 650 USDT has not moved.</p>
      <h5>The path, in order (UTC)</h5>
      <table><tr><th>Time</th><th>Chain</th><th>Transaction</th><th>To</th><th class="r">USDT</th></tr>
        ${rowsFlat.filter((r) => r.tx).map((r) => `<tr class="${r.mark ? 'hit' : ''}"><td class="mono">${r.t}</td><td>${r.ch === 'TRON>ETH' ? 'TRON to ETH' : r.ch === 'ETH' ? 'Ethereum' : r.ch}</td><td class="mono">${r.tx.slice(0, 8)}…${r.tx.slice(-6)}</td><td>${r.to === 'Bridge to' ? 'Bridge' : r.to} <span class="mono">${short(r.addr)}</span></td><td class="r">${money(r.amt)}</td></tr>`).join('')}
      </table>
      <h5>What to do next</h5>
      <ol><li>Report it to the police. In the US: ic3.gov and ReportFraud.ftc.gov. In the UK: Report Fraud, reportfraud.police.uk.</li>
        <li>Give them this report and ask them to request a freeze from Kestrel Exchange for deposit address <span class="mono">0x8d03…41be</span>.</li>
        <li>The USDT issuer can also freeze tokens on a police request. The addresses above are all it needs.</li></ol>
    </div></div>
  </div>

  <div class="pop" id="pop">
    <div class="k">Label</div>
    <h4>Kestrel Exchange, deposit address</h4>
    <div class="addr">${'0x8d039ea4b3b69c513d647c96d97811f886db41be'}</div>
    <dl><dt>Source</dt><dd>Open labelled dataset, Sep 2026</dd>
      <dt>Also seen</dt><dd>3 sweeps from this address into Kestrel’s hot wallet</dd>
      <dt>Confidence</dt><dd><span class="meter"><i class="on"></i><i class="on"></i><i class="on"></i></span>High</dd></dl>
    <div class="fine">A deposit address belongs to one customer account. Kestrel can tell the police whose it is.</div>
  </div>
</div>`;
  }

  // Money trail ribbons. Widths follow the amounts; x is the lane inside the 176 px gutter.
  const K = 44 / CASE.total;
  const W = (a) => a * K;
  // A strand is a list of stops { y, x, w }: one seamless band with vertical
  // tangents between stops, so it can change lanes without visible joins.
  function strand(stops) {
    const edge = (side) => stops.map((p) => [p.x + side * p.w / 2, p.y]);
    const curve = (pts) => pts.slice(1).map(([x, y], i) => {
      const [px, py] = pts[i];
      const ym = (py + y) / 2;
      return px === x ? `L${x} ${y}` : `C${px} ${ym} ${x} ${ym} ${x} ${y}`;
    }).join('');
    const l = edge(-1), r = edge(1).reverse();
    return `M${l[0][0]} ${l[0][1]}${curve(l)}L${r[0][0]} ${r[0][1]}${curve(r)}Z`;
  }
  let reveal = Infinity;
  function drawFlow() {
    const st = document.getElementById('st');
    const svg = document.getElementById('flow');
    if (!st || !svg) return;
    const top = st.getBoundingClientRect().top;
    const box = (sel) => { const r = st.querySelector(sel).getBoundingClientRect(); return { t: r.top - top, b: r.bottom - top, c: (r.top + r.bottom) / 2 - top }; };
    const head = box('.head'), h2 = box('[data-hop="2"]'), h3 = box('[data-hop="3"]');
    const R = Object.fromEntries(rowsFlat.map((r) => [r.id, box(`[data-id="${r.id}"]`)]));
    const H = st.getBoundingClientRect().height;
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 176 ${H}`);
    const y0 = head.b + 6;
    // Three strands from the start: mixer | not moved | exchange. The strand that
    // reached the exchange is solid ink; the others are lighter.
    const L = 36;
    const mixW = W(1900), stillW = W(650), exW = W(9850);
    const mxC = L + mixW / 2, stC = L + mixW + stillW / 2, exC = L + mixW + stillW + exW / 2;
    const eth = 144, mx = 14;
    const parts = [
      `<path d="${strand([{ y: y0, x: mxC, w: mixW }, { y: h2.c, x: mxC, w: mixW }, { y: R.r4.c, x: mx, w: mixW }, { y: R.r6.c, x: mx, w: mixW }])}" fill="#aebbef" stroke="#2446c8" stroke-width="0.8"/>`,
      `<path d="${strand([{ y: y0, x: stC, w: stillW }, { y: R.r7.c, x: stC, w: stillW }])}" fill="#aebbef" stroke="#2446c8" stroke-width="0.6" stroke-opacity="0.7"/>`,
      `<path d="${strand([{ y: y0, x: exC, w: exW }, { y: h3.c, x: exC, w: exW }, { y: R.r5.b, x: eth, w: exW }, { y: R.r8.c, x: eth, w: exW }])}" fill="#2446c8"/>`,
    ];
    // Where each strand stopped: a short floor in the colour of the label.
    const floor = (x, w, y, col) => `<rect x="${x - w / 2 - 5}" y="${y + 1}" width="${w + 10}" height="4" rx="2" fill="${col}"/>`;
    const ends = [floor(mx, mixW, R.r6.c, '#b7791f'), floor(stC, stillW, R.r7.c, '#9a9fa8'), floor(eth, exW, R.r8.c, '#1f8a5b')];
    const lab = (x, t) => `<text x="${x}" y="${head.c + 3.5}" text-anchor="middle" font-family="ui-monospace, 'SF Mono', 'Geist Mono', Menlo, monospace" font-size="10.5" letter-spacing="0.4" fill="#9a9fa8">${t}</text>`;
    const divider = `<path d="M118 ${head.t + 4}V${H - 4}" stroke="#d3d3ca" stroke-dasharray="3 4"/>`;
    // Put the bridge marker where the strand's centre line crosses the divider.
    const x0 = exC, x1 = eth, ya = h3.c, yb = R.r5.b, yh = (ya + yb) / 2;
    const at = (t) => [x0 + (x1 - x0) * (3 * t * t - 2 * t * t * t), (1 - t) ** 3 * ya + 3 * (1 - t) ** 2 * t * yh + 3 * (1 - t) * t * t * yh + t ** 3 * yb];
    let lo = 0, hi = 1;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (at(m)[0] < 118) lo = m; else hi = m; }
    const bridge = `<g transform="translate(118 ${at(lo)[1]})"><rect x="-19" y="-8.5" width="38" height="17" rx="4.5" fill="#fbfbf8" stroke="#2446c8" stroke-width="0.8"/><text x="0" y="3.6" text-anchor="middle" font-family="ui-monospace, 'SF Mono', 'Geist Mono', Menlo, monospace" font-size="9.5" fill="#2446c8">bridge</text></g>`;
    svg.innerHTML = `${lab(58, 'TRON')}${lab(eth, 'ETH')}<defs><clipPath id="cut"><rect x="-20" y="0" width="220" height="${Math.max(0, Math.min(H, reveal))}"/></clipPath></defs>${divider}<g clip-path="url(#cut)">${parts.join('')}${ends.join('')}</g>${reveal >= H ? bridge : ''}`;
  }

  const api = {};
  const $ = (id) => document.getElementById(id);
  function setView(name) {
    for (const v of ['home', 'case', 'clues', 'shield']) $(v).classList.toggle('on', v === name);
    $('win').classList.toggle('home-on', name === 'home');
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === (name === 'shield' ? '' : name)));
    $('shieldBtn').classList.toggle('on', name === 'shield');
  }

  function setDone(done) {
    $('hd').classList.toggle('tracing', !done);
    $('side').classList.toggle('tracing', !done);
    document.querySelectorAll('.end').forEach((e) => e.classList.toggle('pending', !done));
    document.querySelectorAll('.end .track b').forEach((b) => { b.style.width = done ? b.dataset.w + '%' : '0'; });
    $('clueCard').classList.toggle('pending', !done);
  }

  api.home = () => {
    setView('home');
    $('homeVal').textContent = '';
    $('homeChip').classList.add('hide');
    $('homeField').classList.remove('focus');
  };
  api.paste = () => {
    $('homeField').classList.add('focus');
    const v = $('homeVal');
    v.textContent = CASE.input;
    v.classList.remove('paste'); void v.offsetWidth; v.classList.add('paste');
    setTimeout(() => $('homeChip').classList.remove('hide'), 350);
  };
  api.press = async (id) => { $(id).classList.add('press'); await sleep(140); $(id).classList.remove('press'); };

  // Instant final state, for screenshots.
  api.done = () => {
    setView('case');
    api.report(false); api.hover(null);
    document.querySelectorAll('.st .pending').forEach((e) => e.classList.remove('pending'));
    reveal = Infinity; drawFlow();
    setDone(true);
    $('markHead').classList.remove('off');
  };

  // Animated trace: rows arrive in order, ribbons follow, then the verdict.
  api.trace = async (ms = 4200) => {
    setView('case');
    api.report(false); api.hover(null);
    setDone(false);
    $('markHead').classList.add('off');
    const items = [...document.querySelectorAll('.st .hop, .st .row')];
    items.forEach((e) => e.classList.add('pending'));
    const st = $('st');
    reveal = 0; drawFlow();
    const step = ms / items.length;
    const notes = ['Reading the first transaction', 'Checking the collector against scam reports', 'Following the split', 'Following the bridge to Ethereum', 'Checking labels at the end of the trail'];
    let tx = 0, wallets = 1, labels = 0;
    const target = { y: 0 };
    let anim = true;
    (function follow() {
      if (!anim) return;
      reveal += (target.y - reveal) * 0.18;
      drawFlow();
      requestAnimationFrame(follow);
    })();
    for (let i = 0; i < items.length; i++) {
      const el = items[i];
      el.classList.remove('pending');
      const r = el.getBoundingClientRect();
      target.y = r.bottom - st.getBoundingClientRect().top + 2;
      if (el.classList.contains('row')) { tx += el.classList.contains('quiet') ? 0 : 1; wallets += 1; labels += 2; }
      $('cTx').textContent = tx; $('cW').textContent = Math.min(wallets, 6); $('cL').textContent = labels;
      if (i >= 7) $('cCh').textContent = 2;
      const hop = Math.min(4, 1 + items.slice(0, i + 1).filter((e) => e.classList.contains('hop')).length - 1);
      $('busyMeta').textContent = `Tracing hop ${Math.max(1, hop)} of 4`;
      $('busyNow').textContent = notes[Math.min(notes.length - 1, Math.floor((i / items.length) * notes.length))];
      $('busyBar').style.width = `${Math.round(((i + 1) / items.length) * 100)}%`;
      await sleep(step);
    }
    target.y = 1e4;
    await sleep(500);
    anim = false;
    reveal = Infinity; drawFlow();
    setDone(true);
    await sleep(450);
    $('markHead').classList.remove('off');
  };

  api.hover = (id) => {
    document.querySelectorAll('.end').forEach((e) => e.classList.toggle('hover', e.dataset.end === id));
    const pop = $('pop');
    if (!id) { pop.classList.remove('on'); return; }
    const card = document.querySelector(`.end[data-end="${id}"]`).getBoundingClientRect();
    const win = $('win').getBoundingClientRect();
    pop.style.left = `${card.left - win.left - 350 - 14}px`;
    pop.style.top = `${card.top - win.top - 6}px`;
    pop.classList.add('on');
  };

  api.report = (on = true) => {
    $('sheetWrap').classList.toggle('on', on);
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === (on ? 'report' : $('case').classList.contains('on') ? 'case' : '')));
  };

  api.clues = () => { api.report(false); api.hover(null); setView('clues'); };

  api.shield = async (animate = false) => {
    api.report(false); api.hover(null);
    setView('shield');
    const v = $('shieldVal');
    const reasons = [...document.querySelectorAll('.reason')];
    if (!animate) {
      v.textContent = 'chainrestore-legal.com';
      $('verdict').classList.remove('pending');
      reasons.forEach((r) => r.classList.remove('pending'));
      return;
    }
    v.textContent = '';
    $('verdict').classList.add('pending');
    reasons.forEach((r) => r.classList.add('pending'));
    $('shieldField').classList.add('focus');
    const text = 'chainrestore-legal.com';
    for (let i = 1; i <= text.length; i++) { v.textContent = text.slice(0, i); await sleep(45 + (i * 13) % 35); }
    await sleep(350);
    $('shieldField').classList.remove('focus');
    $('verdict').classList.remove('pending');
    for (const r of reasons) { await sleep(420); r.classList.remove('pending'); }
  };

  window.ferret = api;
  render(document.getElementById('app'));
  if (document.fonts) document.fonts.ready.then(drawFlow);
  window.addEventListener('resize', drawFlow);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (t?.dataset.tab === 'case') api.done();
    if (t?.dataset.tab === 'clues') api.clues();
    if (t?.dataset.tab === 'report') { api.done(); api.report(true); }
    if (e.target.closest('#shieldBtn')) api.shield();
    if (e.target.closest('#traceBtn')) api.trace();
    if (e.target.closest('#reportBtn')) api.report(true);
  });
})();
