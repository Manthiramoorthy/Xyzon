const fs = require('fs');
const path = require('path');
const getTemplateService = () => {
    const templatesDir = path.join(__dirname, '../../assets/templates');
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
    return files.map(filename => {
        const content = fs.readFileSync(path.join(templatesDir, filename), 'utf8');
        return { filename, content };
    });
};

module.exports = getTemplateService