const { Transformer } = require('markmap-lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(400).json({ error: 'Markdown content is required' });
    }

    const transformer = new Transformer();
    const { root, features } = transformer.transform(markdown);
    
    // Convert the mindmap data to SVG
    const width = 800;
    const height = 600;
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .markmap-node {
            cursor: pointer;
          }
          .markmap-node-circle {
            fill: #fff;
            stroke-width: 1.5px;
          }
          .markmap-node-text {
            fill: #000;
            font: 10px sans-serif;
          }
          .markmap-link {
            fill: none;
            stroke: #555;
            stroke-width: 1.5px;
          }
        </style>
        <g transform="translate(${width / 2},${height / 2})">${generateSVG(root)}</g>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  } catch (error) {
    console.error('Error processing markdown:', error);
    res.status(500).json({ 
      error: 'Failed to process markdown',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

function generateSVG(node, x = 0, y = 0) {
  let svg = `
    <g class="markmap-node">
      <circle class="markmap-node-circle" r="5" cx="${x}" cy="${y}"/>
      <text class="markmap-node-text" x="${x + 10}" y="${y + 4}">${node.content}</text>
    </g>
  `;

  if (node.children) {
    const spacing = 40;
    node.children.forEach((child, i) => {
      const childX = x + 100;
      const childY = y + (i - (node.children.length - 1) / 2) * spacing;
      svg += `
        <path class="markmap-link" d="M ${x} ${y} C ${(x + childX) / 2} ${y}, ${(x + childX) / 2} ${childY}, ${childX} ${childY}"/>
      `;
      svg += generateSVG(child, childX, childY);
    });
  }

  return svg;
} 