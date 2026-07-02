// Small hand-built SVG shape library used to build busy, illustrated
// chat backgrounds (clouds, stars, hearts, balloons, animals, etc.)
// instead of flat gradients. Shapes are plain strings composed into a
// tileable SVG pattern, then encoded as a CSS data URI.

export function toDataUri(svgBody: string, size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgBody}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function star(cx: number, cy: number, r: number, color: string, opacity = 1) {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${color}" opacity="${opacity}"/>`;
}

export function dot(cx: number, cy: number, r: number, color: string, opacity = 1) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
}

export function heart(cx: number, cy: number, s: number, color: string, opacity = 1) {
  const u = s / 20;
  return `<path d="M${cx},${cy + 7 * u} C${cx - 11 * u},${cy - 1 * u} ${cx - 11 * u},${cy - 13 * u} ${cx},${cy - 6 * u} C${cx + 11 * u},${cy - 13 * u} ${cx + 11 * u},${cy - 1 * u} ${cx},${cy + 7 * u} Z" fill="${color}" opacity="${opacity}"/>`;
}

export function cloud(cx: number, cy: number, scale: number, color: string, opacity = 1) {
  return `<g opacity="${opacity}" fill="${color}" transform="translate(${cx},${cy}) scale(${scale})">
    <ellipse cx="0" cy="4" rx="24" ry="13"/>
    <ellipse cx="17" cy="-4" rx="15" ry="13"/>
    <ellipse cx="-17" cy="-2" rx="13" ry="11"/>
    <ellipse cx="0" cy="-10" rx="13" ry="10"/>
  </g>`;
}

export function sun(cx: number, cy: number, r: number, color: string, opacity = 1) {
  const rays: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const x1 = cx + Math.cos(angle) * (r + 4);
    const y1 = cy + Math.sin(angle) * (r + 4);
    const x2 = cx + Math.cos(angle) * (r + 12);
    const y2 = cy + Math.sin(angle) * (r + 12);
    rays.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`,
    );
  }
  return `<g opacity="${opacity}">${rays.join("")}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/></g>`;
}

export function moon(cx: number, cy: number, r: number, color: string, opacity = 1) {
  return `<path d="M${cx},${cy - r} A${r},${r} 0 1 0 ${cx},${cy + r} A${r * 0.55},${r * 0.55} 0 1 1 ${cx},${cy - r} Z" fill="${color}" opacity="${opacity}"/>`;
}

export function balloon(cx: number, cy: number, scale: number, color: string, opacity = 1) {
  const u = scale;
  return `<g opacity="${opacity}">
    <ellipse cx="${cx}" cy="${cy}" rx="${12 * u}" ry="${15 * u}" fill="${color}"/>
    <polygon points="${cx - 3 * u},${cy + 13 * u} ${cx + 3 * u},${cy + 13 * u} ${cx},${cy + 18 * u}" fill="${color}"/>
    <line x1="${cx}" y1="${cy + 18 * u}" x2="${cx}" y2="${cy + 34 * u}" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
  </g>`;
}

export function flower(cx: number, cy: number, s: number, petalColor: string, centerColor: string, opacity = 1) {
  const petals: string[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    const px = cx + Math.cos(angle) * s;
    const py = cy + Math.sin(angle) * s;
    petals.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${s * 0.7}" fill="${petalColor}"/>`);
  }
  return `<g opacity="${opacity}">${petals.join("")}<circle cx="${cx}" cy="${cy}" r="${s * 0.55}" fill="${centerColor}"/></g>`;
}

export function tree(cx: number, cy: number, scale: number, foliage: string, trunk: string, opacity = 1) {
  const u = scale;
  return `<g opacity="${opacity}">
    <rect x="${cx - 3 * u}" y="${cy + 8 * u}" width="${6 * u}" height="${12 * u}" fill="${trunk}"/>
    <polygon points="${cx},${cy - 22 * u} ${cx - 14 * u},${cy + 2 * u} ${cx + 14 * u},${cy + 2 * u}" fill="${foliage}"/>
    <polygon points="${cx},${cy - 12 * u} ${cx - 11 * u},${cy + 9 * u} ${cx + 11 * u},${cy + 9 * u}" fill="${foliage}"/>
  </g>`;
}

export function mushroom(cx: number, cy: number, scale: number, cap: string, stem: string, opacity = 1) {
  const u = scale;
  return `<g opacity="${opacity}">
    <rect x="${cx - 4 * u}" y="${cy}" width="${8 * u}" height="${12 * u}" rx="${2 * u}" fill="${stem}"/>
    <path d="M${cx - 13 * u},${cy + 1 * u} a${13 * u},${9 * u} 0 1 1 ${26 * u},0 z" fill="${cap}"/>
    <circle cx="${cx - 5 * u}" cy="${cy - 5 * u}" r="${1.6 * u}" fill="white" opacity="0.7"/>
    <circle cx="${cx + 5 * u}" cy="${cy - 3 * u}" r="${1.3 * u}" fill="white" opacity="0.7"/>
  </g>`;
}

export function fish(cx: number, cy: number, scale: number, color: string, opacity = 1) {
  const u = scale;
  return `<g opacity="${opacity}" fill="${color}">
    <ellipse cx="${cx}" cy="${cy}" rx="${11 * u}" ry="${7 * u}"/>
    <polygon points="${cx - 10 * u},${cy} ${cx - 18 * u},${cy - 6 * u} ${cx - 18 * u},${cy + 6 * u}"/>
    <circle cx="${cx + 6 * u}" cy="${cy - 1.5 * u}" r="${1.4 * u}" fill="white"/>
  </g>`;
}

export function wave(cx: number, cy: number, w: number, color: string, opacity = 1) {
  return `<path d="M${cx - w},${cy} q${w / 4},-10 ${w / 2},0 t${w / 2},0" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="${opacity}"/>`;
}

export function planet(cx: number, cy: number, r: number, color: string, ringColor: string, opacity = 1) {
  return `<g opacity="${opacity}">
    <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.9}" ry="${r * 0.5}" fill="none" stroke="${ringColor}" stroke-width="2.5" transform="rotate(-20 ${cx} ${cy})"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>
  </g>`;
}

export function sparkle(cx: number, cy: number, r: number, color: string, opacity = 1) {
  return `<g opacity="${opacity}" stroke="${color}" stroke-width="2" stroke-linecap="round">
    <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}"/>
    <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"/>
  </g>`;
}

// Original critter design (not based on any existing character) for the
// "Monster Squad" theme: round body, ear nubs, big friendly eyes.
export function monster(
  cx: number,
  cy: number,
  scale: number,
  bodyColor: string,
  variant: "round" | "horned" = "round",
  opacity = 1,
) {
  const u = scale;
  const ears =
    variant === "horned"
      ? `<polygon points="${cx - 9 * u},${cy - 8 * u} ${cx - 13 * u},${cy - 20 * u} ${cx - 4 * u},${cy - 10 * u}" fill="${bodyColor}"/>
         <polygon points="${cx + 9 * u},${cy - 8 * u} ${cx + 13 * u},${cy - 20 * u} ${cx + 4 * u},${cy - 10 * u}" fill="${bodyColor}"/>`
      : `<circle cx="${cx - 10 * u}" cy="${cy - 9 * u}" r="${5 * u}" fill="${bodyColor}"/>
         <circle cx="${cx + 10 * u}" cy="${cy - 9 * u}" r="${5 * u}" fill="${bodyColor}"/>`;
  return `<g opacity="${opacity}">
    ${ears}
    <ellipse cx="${cx}" cy="${cy}" rx="${13 * u}" ry="${11 * u}" fill="${bodyColor}"/>
    <circle cx="${cx - 5 * u}" cy="${cy - 2 * u}" r="${3.4 * u}" fill="white"/>
    <circle cx="${cx + 5 * u}" cy="${cy - 2 * u}" r="${3.4 * u}" fill="white"/>
    <circle cx="${cx - 5 * u}" cy="${cy - 2 * u}" r="${1.6 * u}" fill="#2b2b2b"/>
    <circle cx="${cx + 5 * u}" cy="${cy - 2 * u}" r="${1.6 * u}" fill="#2b2b2b"/>
    <path d="M${cx - 4 * u},${cy + 5 * u} Q${cx},${cy + 8 * u} ${cx + 4 * u},${cy + 5 * u}" fill="none" stroke="#2b2b2b" stroke-width="${1.2 * u}" stroke-linecap="round"/>
  </g>`;
}

export function paw(cx: number, cy: number, scale: number, color: string, opacity = 1) {
  const u = scale;
  return `<g opacity="${opacity}" fill="${color}">
    <ellipse cx="${cx}" cy="${cy}" rx="${6 * u}" ry="${5 * u}"/>
    <circle cx="${cx - 6 * u}" cy="${cy - 5 * u}" r="${2.2 * u}"/>
    <circle cx="${cx - 2 * u}" cy="${cy - 8 * u}" r="${2.2 * u}"/>
    <circle cx="${cx + 2 * u}" cy="${cy - 8 * u}" r="${2.2 * u}"/>
    <circle cx="${cx + 6 * u}" cy="${cy - 5 * u}" r="${2.2 * u}"/>
  </g>`;
}

// Gooey slime puddle with drips and a glossy highlight, for the "Slime Time" theme.
export function slimeBlob(cx: number, cy: number, scale: number, color: string, opacity = 1) {
  const u = scale;
  return `<g opacity="${opacity}">
    <path d="M${cx - 16 * u},${cy} q${-2 * u},${10 * u} ${8 * u},${12 * u} q${10 * u},${3 * u} ${18 * u},${-3 * u} q${8 * u},${-5 * u} ${4 * u},${-14 * u} q${-3 * u},${-8 * u} ${-13 * u},${-8 * u} q${-12 * u},${-1 * u} ${-17 * u},${13 * u} z" fill="${color}"/>
    <path d="M${cx - 6 * u},${cy + 11 * u} q${-1 * u},${8 * u} ${2 * u},${11 * u} q${3 * u},${2 * u} ${4 * u},${-2 * u} q${1 * u},${-6 * u} ${-2 * u},${-10 * u} z" fill="${color}"/>
    <ellipse cx="${cx - 5 * u}" cy="${cy - 5 * u}" rx="${4 * u}" ry="${2.4 * u}" fill="white" opacity="0.55"/>
  </g>`;
}

export function bubble(cx: number, cy: number, r: number, color: string, opacity = 1) {
  return `<g opacity="${opacity}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${Math.max(1, r * 0.15)}"/>
    <circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.2}" fill="${color}" opacity="0.6"/>
  </g>`;
}
