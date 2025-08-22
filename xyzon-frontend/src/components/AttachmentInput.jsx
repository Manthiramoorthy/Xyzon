import React, { useState } from 'react';

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


export function AttachmentInput({ onAdd, inputId = 'attach-file' }) {
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');

    const add = async () => {
        if (!file) return;
        const base64 = await fileToBase64(file);
        onAdd({ filename: name || file.name, content: base64, contentType: file.type || 'application/octet-stream' });
        setFile(null);
        setName('');
        document.getElementById(inputId) && (document.getElementById(inputId).value = '');
    };

    return (
        <div className="d-flex gap-2 align-items-center">
            <input id={inputId} className="form-control form-control-sm" type="file" onChange={e => setFile(e.target.files[0])} />
            <input className="form-control form-control-sm" placeholder="filename (optional)" value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={add} disabled={!file}>Add</button>
        </div>
    );
}

