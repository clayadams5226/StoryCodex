export function initializeRichTextEditor() {
    const toolbar = document.getElementById('toolbar');
    const noteContent = document.getElementById('noteContent');
    const formatBlock = document.getElementById('formatBlock');

    toolbar.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
            let command = e.target.id;
            if (command === 'createlink') {
                let url = prompt('Enter the link URL');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, null);
            }
        }
    });

    formatBlock.addEventListener('change', function(e) {
        document.execCommand('formatBlock', false, e.target.value);
    });

    noteContent.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            document.execCommand('insertParagraph', false);
            e.preventDefault();
        }
    });
}