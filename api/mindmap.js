import { Transformer } from 'markmap-lib';

import { fillTemplate } from 'markmap-render';

import nodeHtmlToImage from 'node-html-to-image';

export default async (req, res) => {
	if (req.method !== 'POST') {
		return sendResponse(res, -1, '', 'Method not allowed');
	}

	try {
		const { markdown } = req.body;

		if (!markdown) {
			return sendResponse(res, -1, '', 'Markdown content is required');
		}

		const transformer = new Transformer();
		const { root, features } = transformer.transform(markdown);
		const assets = transformer.getUsedAssets(features);
		const html =
			fillTemplate(root, assets, {
				jsonOptions: {
					duration: 0,
					maxInitialScale: 5,
				},
			}) +
			`
	<style>
	body,
	#mindmap {
	  width: 512px;
	  height: 512px;
	}
	</style>
	`;


		const svg = await nodeHtmlToImage({ html });

		// 将svg转化成base64 png
		const base64 = svg.toString('base64');
		const dataUri = `data:image/png;base64,${base64}`;

		return sendResponse(res, 0, {
			dataUri:dataUri,
		});
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



