import { Transformer } from 'markmap-lib';

export default async (req, res) => {
	if (req.method !== 'POST') {
		return sendResponse(res, -1, '', 'Method not allowed');
	}

	try {
		const { markdown } = req.body;

		if (!markdown) {
			return sendResponse(res, -1, '', 'Markdown content is required');
		}

		// 使用 Transformer 将 Markdown 转换为树形结构
		const transformer = new Transformer();
		const { root } = transformer.transform(markdown);

		// 生成 SVG
		const svgContent = generateSVG(renderNode(root));

		return sendResponse(res, 0, { svg: svgContent, json: `${JSON.stringify(root)}` });
	} catch (error) {
		console.error('Error:', error);
		return sendResponse(res, -1, '', error.message || 'Server error');
	}
};

// 发送响应的封装函数
function sendResponse(res, code, data, msg) {
	return res.status(200).json({
		code,
		res: data,
		msg
	});
}

// 递归生成 SVG 节点
function renderNode(node,nodeHeight=0, x = 0, y = 0, level = 0) {
	const fontSize = Math.max(18, 24 - level * 8);
	const spacing = Math.max(20, 40 - level * 5);
	let output = '';
	let textWidth = calculateTextWidth(node.content, fontSize); // 计算文本宽度

	// 生成节点的 SVG 内容
	output += createNodeSVG(node, x, y, fontSize);

	if (node.children && node.children.length > 0) {
		let totalHeight = 0; // 计算所有兄弟节点的总高度
		let handleHeight = 0;

		node.children.forEach(child => {
			totalHeight += calculateChildHeight(child, spacing, fontSize);
		});

		let currentY = y - nodeHeight / 2; // 计算当前 y 值，居中所有子节点

		node.children.forEach((child, index) => {
			const childHeight = calculateChildHeight(child, spacing, fontSize);
			handleHeight += childHeight/2

			const childX = Math.max(x + 160, x + textWidth + 40); // 根据文字宽度计算 childX，最小值为 160
			const childY = currentY + handleHeight; // 考虑文字高度影响


			// 计算连线的起点为文本末尾
			const startX = x + 8 + textWidth; // 文本末尾的 x 坐标
			const startY = y; // 文本的 y 坐标

			output += `
        <path class="markmap-link" d="M ${startX} ${startY} 
          C ${(startX + childX) / 2} ${startY},
            ${(startX + childX) / 2} ${childY},
            ${childX} ${childY}"/>
      `;

			output += renderNode(child, totalHeight, childX, childY, level + 1);
		});
	}

	return output;
}

// 计算子节点的总高度
function calculateChildHeight(node, spacing, fontSize) {
	if (!node.children || node.children.length === 0) {
		return fontSize; // 只有一个节点的高度
	}

	let totalHeight = 0;
	node.children.forEach(child => {
		totalHeight += calculateChildHeight(child, spacing, fontSize); // 递归计算
		totalHeight += spacing; // 加上间距
	});

	return totalHeight;
}

// 生成节点的 SVG 内容
function createNodeSVG(node, x, y, fontSize) {
	const content = escapeHtml(node.content || '');

	return `
      <g class="markmap-node">
        <text class="markmap-node-text" x="${x + 8}" y="${y + 4}" style="font-size: ${fontSize}px">
          ${content}
        </text>
      </g>
    `;
}

// 计算文本宽度（估算）
function calculateTextWidth(content, fontSize) {
	// 估算每个字符的宽度为 fontSize / 2
	return (content ? content.length : 0) * fontSize * 1.2;
}

// 生成 SVG 的外部结构
function generateSVG(content) {
	return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048">
        <style>
          .markmap-node {
            cursor: pointer;
          }
          .markmap-node-circle {
            fill: #fff;
            stroke: #666;
            stroke-width: 1.5px;
          }
          .markmap-node-text {
            fill: #333;
            font: 12px sans-serif;
          }
          .markmap-link {
            fill: none;
            stroke: #666;
            stroke-width: 1.5px;
          }
        </style>
        <g transform="translate(0,1024)">${content}</g>
      </svg>
    `;
}

// HTML 转义函数
function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
} 