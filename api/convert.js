import { Transformer } from 'markmap-lib';
import cors from 'cors';

// 初始化transformer
const transformer = new Transformer();

// 处理CORS中间件
const corsMiddleware = cors({
  origin: '*', // 在生产环境中应该限制具体域名
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
});

export default async function handler(req, res) {
  // 应用CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { markdown } = req.body;

    // 验证输入
    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Invalid markdown content' });
    }

    // 转换markdown为思维导图数据
    const { root, features } = transformer.transform(markdown);
    
    // 生成SVG
    const svg = transformer.renderSvg(root);

    // 返回SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);

  } catch (error) {
    console.error('Conversion error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 