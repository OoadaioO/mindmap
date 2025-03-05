module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({
      code: -1,
      res: '',
      msg: 'Method not allowed'
    });
  }

  try {
    const { markdown } = req.body;
    
    if (!markdown) {
      return res.status(200).json({
        code: -1,
        res: '',
        msg: 'Markdown content is required'
      });
    }

    // 这里可以添加处理 markdown 的逻辑
    // 目前返回简单的 "Hello World"
    res.status(200).json({
      code: 0,
      res: 'Hello World',
      msg: ''
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({
      code: -1,
      res: '',
      msg: error.message || 'Server error'
    });
  }
}; 