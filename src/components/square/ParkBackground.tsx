"use client";

/**
 * ParkBackground — Isometric-style miniature garden background for SLOTY plaza.
 *
 * Design goals:
 * - 2.5D isometric perspective with depth
 * - Rich but not noisy: fountain, benches, trees, paths, flowers, lamp posts
 * - Warm, inviting, slightly upscale park atmosphere
 * - "People gather here naturally" feeling
 * - Layered: sky → distant → middle → foreground
 * - Soft shadows and gradients for depth
 * - SLOTY lavender/pink color accents woven in
 */
export default function ParkBackground() {
  return (
    <svg
      viewBox="0 0 800 700"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        {/* Sky gradient — warm afternoon */}
        <linearGradient id="pk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D6E8F8" />
          <stop offset="50%" stopColor="#E4EFF9" />
          <stop offset="100%" stopColor="#EFF3E8" />
        </linearGradient>

        {/* Grass gradients with depth */}
        <linearGradient id="pk-grass-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8D98A" />
          <stop offset="100%" stopColor="#8ECF6E" />
        </linearGradient>
        <linearGradient id="pk-grass-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ECF6E" />
          <stop offset="100%" stopColor="#7BC35E" />
        </linearGradient>

        {/* Path texture */}
        <linearGradient id="pk-path" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0E4D0" />
          <stop offset="50%" stopColor="#E8D8C0" />
          <stop offset="100%" stopColor="#F2E6D2" />
        </linearGradient>
        <linearGradient id="pk-path-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8CDB8" />
          <stop offset="100%" stopColor="#E0D4C0" />
        </linearGradient>

        {/* Water */}
        <radialGradient id="pk-water" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#C5E8F5" />
          <stop offset="60%" stopColor="#A0D4EA" />
          <stop offset="100%" stopColor="#88C4DE" />
        </radialGradient>
        <radialGradient id="pk-water-shine" cx="35%" cy="30%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Tree foliage gradients */}
        <radialGradient id="pk-tree1" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#7CC064" />
          <stop offset="100%" stopColor="#5DA34A" />
        </radialGradient>
        <radialGradient id="pk-tree2" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#6DB85C" />
          <stop offset="100%" stopColor="#4E9240" />
        </radialGradient>
        <radialGradient id="pk-tree3" cx="45%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#88CC72" />
          <stop offset="100%" stopColor="#66A850" />
        </radialGradient>

        {/* Lamp glow */}
        <radialGradient id="pk-lamp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,240,200,0.5)" />
          <stop offset="100%" stopColor="rgba(255,240,200,0)" />
        </radialGradient>

        {/* Flower bed gradient */}
        <linearGradient id="pk-flowerbed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5DA34A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4E9240" stopOpacity="0.15" />
        </linearGradient>

        {/* Subtle noise for texture */}
        <filter id="pk-soft">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>

        {/* Shadow filter */}
        <filter id="pk-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* ═══════ SKY ═══════ */}
      <rect width="800" height="700" fill="url(#pk-sky)" />

      {/* Distant clouds */}
      <ellipse cx="150" cy="60" rx="80" ry="22" fill="white" opacity="0.35" />
      <ellipse cx="120" cy="55" rx="50" ry="18" fill="white" opacity="0.4" />
      <ellipse cx="580" cy="80" rx="70" ry="20" fill="white" opacity="0.3" />
      <ellipse cx="620" cy="75" rx="45" ry="16" fill="white" opacity="0.35" />
      <ellipse cx="380" cy="45" rx="55" ry="15" fill="white" opacity="0.25" />

      {/* Distant buildings / city silhouette (very faint) */}
      <rect x="30" y="100" width="22" height="50" rx="2" fill="#C8D0D8" opacity="0.25" />
      <rect x="55" y="85" width="18" height="65" rx="2" fill="#C4CCD4" opacity="0.2" />
      <rect x="76" y="105" width="15" height="45" rx="2" fill="#CCD4DC" opacity="0.22" />
      <rect x="680" y="90" width="20" height="60" rx="2" fill="#C8D0D8" opacity="0.2" />
      <rect x="705" y="100" width="16" height="50" rx="2" fill="#CCD4DC" opacity="0.18" />
      <rect x="725" y="110" width="22" height="40" rx="2" fill="#C4CCD4" opacity="0.2" />
      <rect x="350" y="95" width="12" height="38" rx="1" fill="#CCD4DC" opacity="0.12" />
      <rect x="440" y="100" width="15" height="35" rx="1" fill="#C8D0D8" opacity="0.12" />

      {/* Distant tree line */}
      <ellipse cx="200" cy="148" rx="40" ry="18" fill="#9CC088" opacity="0.35" />
      <ellipse cx="260" cy="145" rx="35" ry="16" fill="#8AB875" opacity="0.3" />
      <ellipse cx="550" cy="148" rx="38" ry="17" fill="#9CC088" opacity="0.32" />
      <ellipse cx="480" cy="150" rx="30" ry="14" fill="#8AB875" opacity="0.25" />

      {/* ═══════ GROUND ═══════ */}
      {/* Far grass (lighter, farther away) */}
      <rect y="150" width="800" height="550" fill="url(#pk-grass-far)" />

      {/* Ground elevation lines for subtle depth */}
      <ellipse cx="400" cy="300" rx="360" ry="120" fill="url(#pk-grass-near)" opacity="0.4" />
      <ellipse cx="400" cy="380" rx="380" ry="100" fill="url(#pk-grass-near)" opacity="0.3" />

      {/* Grass texture patches */}
      <ellipse cx="120" cy="480" rx="60" ry="15" fill="#7BC35E" opacity="0.2" />
      <ellipse cx="650" cy="520" rx="55" ry="12" fill="#7BC35E" opacity="0.18" />
      <ellipse cx="350" cy="560" rx="70" ry="16" fill="#82C960" opacity="0.15" />

      {/* ═══════ PATHS ═══════ */}
      {/* Main horizontal path — gentle curve */}
      <path
        d="M0 400 Q150 375 300 388 Q400 395 500 388 Q650 375 800 400
           L800 425 Q650 400 500 413 Q400 420 300 413 Q150 400 0 425Z"
        fill="url(#pk-path)" opacity="0.85"
      />
      {/* Path edge shadows */}
      <path
        d="M0 425 Q150 400 300 413 Q400 420 300 413 Q150 400 0 425"
        fill="url(#pk-path-shadow)" opacity="0.3"
      />

      {/* Vertical center path */}
      <path
        d="M380 200 Q385 280 390 350 Q395 395 400 410 Q405 395 410 350 Q415 280 420 200Z"
        fill="url(#pk-path)" opacity="0.75"
      />

      {/* Diagonal path — upper left to center */}
      <path
        d="M100 200 Q200 280 350 370 L365 365 Q210 275 115 195Z"
        fill="url(#pk-path)" opacity="0.6"
      />

      {/* Diagonal path — upper right to center */}
      <path
        d="M700 200 Q600 280 450 370 L435 365 Q590 275 685 195Z"
        fill="url(#pk-path)" opacity="0.6"
      />

      {/* Small path — lower left */}
      <path
        d="M200 410 Q250 470 200 550 L215 555 Q265 475 215 415Z"
        fill="url(#pk-path)" opacity="0.55"
      />

      {/* Small path — lower right */}
      <path
        d="M600 410 Q550 470 600 550 L585 555 Q535 475 585 415Z"
        fill="url(#pk-path)" opacity="0.55"
      />

      {/* Path stone texture dots */}
      {[
        [200, 390], [300, 395], [400, 410], [500, 395], [600, 390],
        [250, 400], [350, 405], [450, 408], [550, 400], [150, 395],
        [400, 300], [395, 340], [390, 260],
      ].map(([cx, cy], i) => (
        <circle key={`stone-${i}`} cx={cx} cy={cy} r="2" fill="#D4C8B4" opacity="0.4" />
      ))}

      {/* ═══════ CENTRAL FOUNTAIN ═══════ */}
      {/* Fountain shadow */}
      <ellipse cx="400" cy="365" rx="80" ry="25" fill="#000" opacity="0.06" />

      {/* Fountain outer rim */}
      <ellipse cx="400" cy="340" rx="75" ry="32" fill="#D0CCC4" />
      <ellipse cx="400" cy="336" rx="75" ry="32" fill="#E0DCD4" />

      {/* Water surface */}
      <ellipse cx="400" cy="334" rx="65" ry="26" fill="url(#pk-water)" />
      <ellipse cx="400" cy="334" rx="65" ry="26" fill="url(#pk-water-shine)" />

      {/* Water ripple rings */}
      <ellipse cx="400" cy="336" rx="45" ry="18" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.3" />
      <ellipse cx="400" cy="338" rx="30" ry="12" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.2" />

      {/* Fountain center column */}
      <rect x="394" y="302" width="12" height="36" rx="6" fill="#D4D0C8" />
      <rect x="393" y="300" width="14" height="4" rx="2" fill="#C8C4BC" />

      {/* Fountain top bowl */}
      <ellipse cx="400" cy="298" rx="16" ry="6" fill="#D8D4CC" />
      <ellipse cx="400" cy="296" rx="14" ry="5" fill="#88C4DE" opacity="0.6" />

      {/* Water spray — elegant arcs */}
      <path d="M400 290 Q394 272 388 282" stroke="#A8D8EE" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M400 290 Q400 268 400 280" stroke="#A8D8EE" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d="M400 290 Q406 272 412 282" stroke="#A8D8EE" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Side sprays */}
      <path d="M400 290 Q390 276 382 286" stroke="#B0DCEE" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M400 290 Q410 276 418 286" stroke="#B0DCEE" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Water droplets */}
      <circle cx="390" cy="278" r="1.5" fill="#C5E8F5" opacity="0.6" />
      <circle cx="410" cy="275" r="1.5" fill="#C5E8F5" opacity="0.5" />
      <circle cx="400" cy="272" r="2" fill="#D0EEFA" opacity="0.7" />
      <circle cx="385" cy="284" r="1" fill="#C5E8F5" opacity="0.4" />
      <circle cx="415" cy="283" r="1" fill="#C5E8F5" opacity="0.4" />

      {/* ═══════ FLOWER BEDS ═══════ */}
      {/* Left flower bed (near fountain) */}
      <ellipse cx="290" cy="345" rx="35" ry="12" fill="url(#pk-flowerbed)" />
      {/* Flowers — lavender/pink mix (SLOTY colors) */}
      <circle cx="275" cy="340" r="4" fill="#B79DFF" opacity="0.7" />
      <circle cx="283" cy="337" r="3.5" fill="#F3A7C6" opacity="0.75" />
      <circle cx="291" cy="339" r="4" fill="#B79DFF" opacity="0.65" />
      <circle cx="299" cy="341" r="3.5" fill="#F3A7C6" opacity="0.7" />
      <circle cx="305" cy="338" r="3" fill="#9B8AFB" opacity="0.6" />
      <circle cx="280" cy="344" r="3" fill="#F3A7C6" opacity="0.5" />
      <circle cx="295" cy="346" r="3.5" fill="#B79DFF" opacity="0.55" />
      {/* Leaves */}
      <ellipse cx="278" cy="347" rx="5" ry="2" fill="#6BA55A" opacity="0.4" />
      <ellipse cx="296" cy="349" rx="5" ry="2" fill="#6BA55A" opacity="0.35" />

      {/* Right flower bed */}
      <ellipse cx="510" cy="345" rx="35" ry="12" fill="url(#pk-flowerbed)" />
      <circle cx="495" cy="340" r="3.5" fill="#F3A7C6" opacity="0.7" />
      <circle cx="503" cy="337" r="4" fill="#B79DFF" opacity="0.65" />
      <circle cx="512" cy="340" r="3.5" fill="#F3A7C6" opacity="0.75" />
      <circle cx="520" cy="342" r="4" fill="#9B8AFB" opacity="0.6" />
      <circle cx="527" cy="339" r="3" fill="#F3A7C6" opacity="0.7" />
      <circle cx="507" cy="345" r="3" fill="#B79DFF" opacity="0.55" />
      <ellipse cx="500" cy="347" rx="5" ry="2" fill="#6BA55A" opacity="0.4" />
      <ellipse cx="518" cy="348" rx="5" ry="2" fill="#6BA55A" opacity="0.35" />

      {/* Small flower cluster - upper left area */}
      <circle cx="145" cy="285" r="3" fill="#F3A7C6" opacity="0.5" />
      <circle cx="152" cy="282" r="2.5" fill="#B79DFF" opacity="0.45" />
      <circle cx="148" cy="289" r="2" fill="#F3A7C6" opacity="0.4" />

      {/* Small flower cluster - lower right */}
      <circle cx="630" cy="490" r="3" fill="#B79DFF" opacity="0.5" />
      <circle cx="637" cy="487" r="2.5" fill="#F3A7C6" opacity="0.45" />
      <circle cx="625" cy="493" r="2" fill="#9B8AFB" opacity="0.4" />

      {/* ═══════ TREES ═══════ */}

      {/* Tree 1 — Large left tree (near entry) */}
      <ellipse cx="88" cy="310" rx="14" ry="4" fill="#000" opacity="0.06" />
      <rect x="83" y="264" width="10" height="48" rx="4" fill="#8B7355" />
      <rect x="81" y="268" width="14" height="6" rx="3" fill="#7A6548" />
      <ellipse cx="88" cy="240" rx="40" ry="35" fill="url(#pk-tree1)" />
      <ellipse cx="78" cy="230" rx="18" ry="15" fill="#88CC72" opacity="0.5" />
      <ellipse cx="102" cy="235" rx="15" ry="13" fill="#7CC064" opacity="0.4" />
      {/* Highlight */}
      <ellipse cx="76" cy="225" rx="10" ry="8" fill="#9FD88A" opacity="0.3" />

      {/* Tree 2 — Right side medium tree */}
      <ellipse cx="710" cy="300" rx="12" ry="3.5" fill="#000" opacity="0.06" />
      <rect x="705" y="260" width="10" height="42" rx="4" fill="#8B7355" />
      <ellipse cx="710" cy="238" rx="35" ry="30" fill="url(#pk-tree2)" />
      <ellipse cx="700" cy="230" rx="15" ry="12" fill="#7CC064" opacity="0.45" />
      <ellipse cx="722" cy="233" rx="13" ry="11" fill="#6DB85C" opacity="0.4" />

      {/* Tree 3 — Upper center-left */}
      <ellipse cx="230" cy="225" rx="10" ry="3" fill="#000" opacity="0.05" />
      <rect x="226" y="196" width="8" height="30" rx="3" fill="#8B7355" />
      <ellipse cx="230" cy="180" rx="28" ry="24" fill="url(#pk-tree3)" />
      <ellipse cx="222" cy="174" rx="12" ry="10" fill="#9FD88A" opacity="0.4" />

      {/* Tree 4 — Upper center-right */}
      <ellipse cx="575" cy="228" rx="10" ry="3" fill="#000" opacity="0.05" />
      <rect x="571" y="198" width="8" height="32" rx="3" fill="#8B7355" />
      <ellipse cx="575" cy="182" rx="30" ry="26" fill="url(#pk-tree1)" />
      <ellipse cx="585" cy="176" rx="12" ry="10" fill="#88CC72" opacity="0.4" />

      {/* Tree 5 — Lower left */}
      <ellipse cx="155" cy="530" rx="12" ry="3.5" fill="#000" opacity="0.06" />
      <rect x="150" y="488" width="10" height="44" rx="4" fill="#8B7355" />
      <ellipse cx="155" cy="468" rx="34" ry="30" fill="url(#pk-tree2)" />
      <ellipse cx="145" cy="460" rx="14" ry="12" fill="#7CC064" opacity="0.45" />

      {/* Tree 6 — Lower right */}
      <ellipse cx="660" cy="530" rx="11" ry="3" fill="#000" opacity="0.05" />
      <rect x="656" y="495" width="9" height="36" rx="3.5" fill="#8B7355" />
      <ellipse cx="660" cy="478" rx="30" ry="26" fill="url(#pk-tree3)" />
      <ellipse cx="668" cy="472" rx="12" ry="10" fill="#9FD88A" opacity="0.35" />

      {/* Small bush / shrub — scattered */}
      <ellipse cx="320" cy="250" rx="18" ry="10" fill="#6BA55A" opacity="0.5" />
      <ellipse cx="315" cy="248" rx="8" ry="6" fill="#7CC064" opacity="0.35" />
      <ellipse cx="485" cy="255" rx="16" ry="9" fill="#6BA55A" opacity="0.5" />
      <ellipse cx="490" cy="253" rx="7" ry="5" fill="#7CC064" opacity="0.35" />

      {/* Low hedge along paths */}
      <ellipse cx="250" cy="376" rx="25" ry="6" fill="#5E9E4A" opacity="0.4" />
      <ellipse cx="550" cy="376" rx="25" ry="6" fill="#5E9E4A" opacity="0.4" />

      {/* ═══════ BENCHES ═══════ */}

      {/* Bench 1 — Left side of path (isometric-ish) */}
      <g transform="translate(170, 375)">
        {/* Shadow */}
        <ellipse cx="20" cy="24" rx="22" ry="5" fill="#000" opacity="0.06" />
        {/* Seat */}
        <rect x="0" y="8" width="40" height="5" rx="1.5" fill="#C4956A" />
        <rect x="0" y="6" width="40" height="3" rx="1" fill="#D4A57A" />
        {/* Back rest */}
        <rect x="2" y="0" width="36" height="4" rx="1.5" fill="#C4956A" />
        <rect x="2" y="-1" width="36" height="3" rx="1" fill="#D4A57A" />
        {/* Legs */}
        <rect x="4" y="13" width="3" height="10" rx="1" fill="#A67B52" />
        <rect x="33" y="13" width="3" height="10" rx="1" fill="#A67B52" />
        {/* Arm rests */}
        <rect x="0" y="2" width="3" height="12" rx="1" fill="#B88B60" />
        <rect x="37" y="2" width="3" height="12" rx="1" fill="#B88B60" />
      </g>

      {/* Bench 2 — Right side of path */}
      <g transform="translate(590, 380)">
        <ellipse cx="20" cy="24" rx="22" ry="5" fill="#000" opacity="0.06" />
        <rect x="0" y="8" width="40" height="5" rx="1.5" fill="#C4956A" />
        <rect x="0" y="6" width="40" height="3" rx="1" fill="#D4A57A" />
        <rect x="2" y="0" width="36" height="4" rx="1.5" fill="#C4956A" />
        <rect x="2" y="-1" width="36" height="3" rx="1" fill="#D4A57A" />
        <rect x="4" y="13" width="3" height="10" rx="1" fill="#A67B52" />
        <rect x="33" y="13" width="3" height="10" rx="1" fill="#A67B52" />
        <rect x="0" y="2" width="3" height="12" rx="1" fill="#B88B60" />
        <rect x="37" y="2" width="3" height="12" rx="1" fill="#B88B60" />
      </g>

      {/* Bench 3 — Near fountain upper */}
      <g transform="translate(360, 275)">
        <ellipse cx="18" cy="22" rx="20" ry="4.5" fill="#000" opacity="0.05" />
        <rect x="0" y="7" width="36" height="4.5" rx="1.5" fill="#C4956A" />
        <rect x="0" y="5.5" width="36" height="3" rx="1" fill="#D4A57A" />
        <rect x="3" y="11.5" width="3" height="9" rx="1" fill="#A67B52" />
        <rect x="30" y="11.5" width="3" height="9" rx="1" fill="#A67B52" />
      </g>

      {/* Bench 4 — Lower area */}
      <g transform="translate(380, 485)">
        <ellipse cx="20" cy="24" rx="22" ry="5" fill="#000" opacity="0.06" />
        <rect x="0" y="8" width="40" height="5" rx="1.5" fill="#C4956A" />
        <rect x="0" y="6" width="40" height="3" rx="1" fill="#D4A57A" />
        <rect x="2" y="0" width="36" height="4" rx="1.5" fill="#C4956A" />
        <rect x="2" y="-1" width="36" height="3" rx="1" fill="#D4A57A" />
        <rect x="4" y="13" width="3" height="10" rx="1" fill="#A67B52" />
        <rect x="33" y="13" width="3" height="10" rx="1" fill="#A67B52" />
      </g>

      {/* ═══════ LAMP POSTS ═══════ */}

      {/* Lamp 1 — left of fountain */}
      <g transform="translate(300, 290)">
        <rect x="3" y="10" width="3" height="40" rx="1" fill="#8A8A8A" />
        <rect x="1" y="46" width="7" height="4" rx="1.5" fill="#7A7A7A" />
        {/* Lamp head */}
        <path d="M0 10 Q4.5 4 9 10" fill="#E8E0D0" />
        <circle cx="4.5" cy="8" r="5" fill="url(#pk-lamp-glow)" />
        <circle cx="4.5" cy="8" r="2.5" fill="#FFF8E8" opacity="0.7" />
      </g>

      {/* Lamp 2 — right of fountain */}
      <g transform="translate(490, 290)">
        <rect x="3" y="10" width="3" height="40" rx="1" fill="#8A8A8A" />
        <rect x="1" y="46" width="7" height="4" rx="1.5" fill="#7A7A7A" />
        <path d="M0 10 Q4.5 4 9 10" fill="#E8E0D0" />
        <circle cx="4.5" cy="8" r="5" fill="url(#pk-lamp-glow)" />
        <circle cx="4.5" cy="8" r="2.5" fill="#FFF8E8" opacity="0.7" />
      </g>

      {/* Lamp 3 — lower left path */}
      <g transform="translate(215, 440)">
        <rect x="3" y="10" width="3" height="35" rx="1" fill="#8A8A8A" />
        <rect x="1" y="42" width="7" height="3" rx="1.5" fill="#7A7A7A" />
        <path d="M0 10 Q4.5 5 9 10" fill="#E8E0D0" />
        <circle cx="4.5" cy="8" r="4.5" fill="url(#pk-lamp-glow)" />
        <circle cx="4.5" cy="8" r="2" fill="#FFF8E8" opacity="0.6" />
      </g>

      {/* Lamp 4 — lower right path */}
      <g transform="translate(575, 440)">
        <rect x="3" y="10" width="3" height="35" rx="1" fill="#8A8A8A" />
        <rect x="1" y="42" width="7" height="3" rx="1.5" fill="#7A7A7A" />
        <path d="M0 10 Q4.5 5 9 10" fill="#E8E0D0" />
        <circle cx="4.5" cy="8" r="4.5" fill="url(#pk-lamp-glow)" />
        <circle cx="4.5" cy="8" r="2" fill="#FFF8E8" opacity="0.6" />
      </g>

      {/* ═══════ DECORATIVE ELEMENTS ═══════ */}

      {/* Small pond / stepping stones near lower-left path */}
      <ellipse cx="240" cy="510" rx="20" ry="10" fill="#A0D4EA" opacity="0.4" />
      <circle cx="235" cy="508" r="4" fill="#C0C8CC" opacity="0.5" />
      <circle cx="245" cy="512" r="3.5" fill="#C0C8CC" opacity="0.45" />

      {/* Decorative stone circle around fountain */}
      <ellipse cx="400" cy="345" rx="82" ry="35" fill="none" stroke="#D0C8BC" strokeWidth="3" opacity="0.4" />
      <ellipse cx="400" cy="344" rx="85" ry="36" fill="none" stroke="#E0D8CC" strokeWidth="1.5" opacity="0.3" />

      {/* Bird (tiny, in the sky) */}
      <path d="M340 90 Q344 85 348 90" stroke="#888" strokeWidth="1" fill="none" opacity="0.3" />
      <path d="M355 95 Q358 91 361 95" stroke="#888" strokeWidth="0.8" fill="none" opacity="0.25" />

      {/* Fallen leaves (subtle) */}
      <ellipse cx="130" cy="305" rx="3" ry="1.5" fill="#D4A574" opacity="0.25" transform="rotate(30 130 305)" />
      <ellipse cx="680" cy="295" rx="2.5" ry="1.2" fill="#C49564" opacity="0.2" transform="rotate(-20 680 295)" />

      {/* Ground shadow patches from trees */}
      <ellipse cx="88" cy="290" rx="35" ry="12" fill="#000" opacity="0.04" />
      <ellipse cx="710" cy="280" rx="30" ry="10" fill="#000" opacity="0.04" />
      <ellipse cx="230" cy="210" rx="24" ry="8" fill="#000" opacity="0.03" />
      <ellipse cx="575" cy="213" rx="26" ry="8" fill="#000" opacity="0.03" />
      <ellipse cx="155" cy="500" rx="30" ry="10" fill="#000" opacity="0.04" />
      <ellipse cx="660" cy="505" rx="26" ry="8" fill="#000" opacity="0.03" />

      {/* ═══════ SLOTY SYMBOL ═══════ */}
      {/* Small SLOTY logo/emblem on fountain base */}
      <circle cx="400" cy="350" r="8" fill="#E8E4DC" opacity="0.5" />
      <circle cx="400" cy="350" r="5" fill="none" stroke="#B79DFF" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
