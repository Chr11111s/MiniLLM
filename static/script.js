document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('imageInput').click();
});

let uploadedFiles = [];

document.getElementById('imageInput').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const attachmentContainer = document.createElement('div');
        attachmentContainer.classList.add('attachment');

        const icon = document.createElement('i');
        icon.classList.add('fas');
        if (file.type.startsWith('image/')) {
            icon.classList.add('fa-file-image');
        } else if (file.type === 'text/plain') {
            icon.classList.add('fa-file-alt');
        } else {
            icon.classList.add('fa-file');
        }

        const fileName = document.createElement('span');
        fileName.textContent = file.name;

        const previewButton = document.createElement('button');
        previewButton.classList.add('preview-button');
        previewButton.textContent = '预览';
        previewButton.onclick = function() {
            showPreview(file);
        };

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-button');
        removeButton.innerHTML = '&times;';
        removeButton.onclick = function() {
            attachmentContainer.remove();
            uploadedFiles = uploadedFiles.filter(f => f !== file);
        };

        attachmentContainer.appendChild(icon);
        attachmentContainer.appendChild(fileName);
        attachmentContainer.appendChild(previewButton);
        attachmentContainer.appendChild(removeButton);

        document.getElementById('uploadedPreview').appendChild(attachmentContainer);
        uploadedFiles.push(file);

        // 清空文件输入框的值，以便后续可以继续上传同一个文件
        document.getElementById('imageInput').value = '';
    }
});

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewModal = document.getElementById('previewModal');
        const previewImage = previewModal.querySelector('.preview-image');
        previewImage.src = e.target.result;
        previewModal.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

document.getElementById('previewModalClose').addEventListener('click', function() {
    document.getElementById('previewModal').style.display = 'none';
});

document.getElementById('inputForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const textInput = document.getElementById('textInput').value.trim();
    const messageList = document.getElementById('messageList');

    if (!textInput && uploadedFiles.length === 0) {
        // 如果没有文本输入且没有附件，则不发送消息
        return;
    }

    // 清空输入框
    document.getElementById('textInput').value = '';

    // 显示用户的消息
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user');
    userMessage.innerHTML = `
        <div class="content">
            <div class="text">${textInput}</div>
            <div class="attachments"></div>
        </div>
        <div class="avatar">You</div>
    `;
    const attachmentContainer = userMessage.querySelector('.attachments');
    uploadedFiles.forEach(file => {
        const attachment = document.createElement('div');
        attachment.classList.add('attachment');

        const icon = document.createElement('i');
        icon.classList.add('fas');
        if (file.type.startsWith('image/')) {
            icon.classList.add('fa-file-image');
        } else if (file.type === 'text/plain') {
            icon.classList.add('fa-file-alt');
        } else {
            icon.classList.add('fa-file');
        }

        const fileName = document.createElement('span');
        fileName.textContent = file.name;

        const previewButton = document.createElement('button');
        previewButton.classList.add('preview-button');
        previewButton.textContent = '预览';
        previewButton.onclick = function() {
            showPreview(file);
        };

        attachment.appendChild(icon);
        attachment.appendChild(fileName);
        attachment.appendChild(previewButton);
        attachmentContainer.appendChild(attachment);
    });
    messageList.appendChild(userMessage);

    // 清空附件预览和上传文件列表
    document.getElementById('uploadedPreview').innerHTML = '';
    uploadedFiles = [];

    // 显示加载动画消息
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('loading-message');
    loadingMessage.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="sr-only">Loading...</span>
        </div>
        <div>Bot is typing...</div>
    `;
    messageList.appendChild(loadingMessage);

    // 滚动到最新消息
    messageList.scrollTop = messageList.scrollHeight;

    try {
        // 从后端获取大模型回复
        const formData = new FormData();
        formData.append('input', textInput);
        uploadedFiles.forEach(file => formData.append('files', file));

        const response = await fetch('/api/text', {
            method: 'POST',
            body: formData
        });

        const responseData = await response.json();

        const botMessage = document.createElement('div');
        botMessage.classList.add('message', 'bot');
        botMessage.innerHTML = `
            <div class="avatar">Bot</div>
            <div class="content">
                <div class="text">${responseData.text}</div>
                <div class="attachments"></div>
            </div>
        `;
        const botAttachmentContainer = botMessage.querySelector('.attachments');
        responseData.images.forEach(image => {
            const attachment = document.createElement('div');
            attachment.classList.add('attachment');

            const icon = document.createElement('i');
            icon.classList.add('fas');
            if (image.type.startsWith('image/')) {
                icon.classList.add('fa-file-image');
            } else if (image.type === 'text/plain') {
                icon.classList.add('fa-file-alt');
            } else {
                icon.classList.add('fa-file');
            }

            const fileName = document.createElement('span');
            fileName.textContent = image.filename;

            const previewButton = document.createElement('button');
            previewButton.classList.add('preview-button');
            previewButton.textContent = '预览';
            previewButton.onclick = function() {
                showPreview(image);
            };

            attachment.appendChild(icon);
            attachment.appendChild(fileName);
            attachment.appendChild(previewButton);
            botAttachmentContainer.appendChild(attachment);
        });
        messageList.replaceChild(botMessage, loadingMessage);
    } catch (error) {
        console.error('Error:', error);
        loadingMessage.innerHTML = `<div class="text">Error: ${error.message}</div>`;
    }

    // 滚动到最新消息
    messageList.scrollTop = messageList.scrollHeight;
});

document.getElementById('textInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('inputForm').dispatchEvent(new Event('submit'));
    }
});
