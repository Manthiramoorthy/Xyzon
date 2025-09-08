const fs = require('fs');
const path = require('path');

// Files and their patterns to replace
const filesToUpdate = [
    'src/pages/AdminEventList.jsx',
    'src/pages/EventCertificates.jsx',
    'src/pages/UserCertificates.jsx',
    'src/pages/EventRegistrations.jsx',
    'src/pages/EventDetails.jsx',
    'src/components/CertificateTemplateManager.jsx'
];

// Import additions for each file
const imports = {
    'useToast': "import { useToast } from '../context/ToastContext';",
    'useConfirm': "import { useConfirm } from '../hooks/useConfirm';"
};

// Function to add imports to a file
function addImports(filePath, content) {
    const lines = content.split('\n');
    const importIndex = lines.findIndex(line => line.startsWith('import '));

    if (importIndex !== -1) {
        // Find the last import line
        let lastImportIndex = importIndex;
        for (let i = importIndex; i < lines.length; i++) {
            if (lines[i].startsWith('import ') || lines[i].trim() === '') {
                lastImportIndex = i;
            } else {
                break;
            }
        }

        // Add our imports after the last import
        lines.splice(lastImportIndex + 1, 0, imports.useToast);
        if (filePath.includes('AdminEventList.jsx') || filePath.includes('EventCertificates.jsx')) {
            lines.splice(lastImportIndex + 2, 0, imports.useConfirm);
        }
    }

    return lines.join('\n');
}

// Function to add hooks to component
function addHooks(content) {
    // Find the component function
    const funcMatch = content.match(/(export default function \w+\(\) \{)/);
    if (funcMatch) {
        const replacement = funcMatch[1] + '\n    const toast = useToast();';
        content = content.replace(funcMatch[1], replacement);

        // Add confirm hook if needed
        if (content.includes('window.confirm')) {
            content = content.replace(
                'const toast = useToast();',
                'const toast = useToast();\n    const confirm = useConfirm();'
            );
        }
    }

    return content;
}

// Function to replace alert calls
function replaceAlerts(content) {
    // Replace simple alerts
    content = content.replace(/alert\('([^']*)'\);/g, "toast.success('$1');");
    content = content.replace(/alert\("([^"]*)"\);/g, 'toast.success("$1");');

    // Replace alerts with error conditions
    content = content.replace(
        /alert\(error\.response\?\.\w+\?\.\w+\s*\|\|\s*'([^']*)'\);/g,
        "toast.error(error.response?.data?.message || '$1');"
    );

    // Replace window.confirm with confirm hook
    content = content.replace(/window\.confirm\(/g, 'await confirm(');
    content = content.replace(/if \(window\.confirm/g, 'if (await confirm');

    return content;
}

// Process each file
filesToUpdate.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);

    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        console.log(`Processing ${filePath}...`);

        // Add imports
        content = addImports(filePath, content);

        // Add hooks
        content = addHooks(content);

        // Replace alerts
        content = replaceAlerts(content);

        // Write back
        fs.writeFileSync(fullPath, content, 'utf8');

        console.log(`✓ Updated ${filePath}`);
    } else {
        console.log(`⚠ File not found: ${filePath}`);
    }
});

console.log('Alert replacement complete!');
