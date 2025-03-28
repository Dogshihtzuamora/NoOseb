let currentPath = '';
        let inputResolver = null;

        async function initializeApp() {
            await fetch('/init');
            loadFolders();
        }

        function showInputDialog(title, defaultName = '') {
            return new Promise((resolve) => {
                const overlay = document.getElementById('inputOverlay');
                const titleEl = document.getElementById('inputTitle');
                const inputEl = document.getElementById('inputName');
                
                titleEl.textContent = title;
                inputEl.value = defaultName;
                overlay.style.display = 'flex';
                
                inputResolver = resolve;
            });
        }

        function confirmInput() {
            const inputEl = document.getElementById('inputName');
            const overlay = document.getElementById('inputOverlay');
            
            if (inputResolver) {
                inputResolver(inputEl.value);
                inputResolver = null;
            }
            
            overlay.style.display = 'none';
        }

        function cancelInput() {
            const overlay = document.getElementById('inputOverlay');
            
            if (inputResolver) {
                inputResolver(null);
                inputResolver = null;
            }
            
            overlay.style.display = 'none';
        }

        function loadFolders(dir = '') {
            currentPath = dir;
            fetch(`/list-folders?dir=${encodeURIComponent(dir)}`)
                .then(response => response.json())
                .then(folders => {
                    const desktop = document.getElementById('desktop');
                    desktop.innerHTML = ''; 
                    
                    folders.forEach((folder, index) => {
                        const folderEl = document.createElement('div');
                        folderEl.className = 'folder';
                        folderEl.innerHTML = `
                            <div class="folder-icon">${folder.type}</div>
                            <div class="folder-name">${folder.name}</div>
                        `;
                        folderEl.onclick = () => {
                            if (folder.type === '📁') {
                                openFolder(folder.path);
                            }
                        };
                        desktop.appendChild(folderEl);
                    });
                });
        }

        function handleCreateFolder() {
            createFolder(currentPath);
            hideContextMenu();
        }

        function handleCreateFile() {
            createFile(currentPath);
            hideContextMenu();
        }

        async function createFolder(parentPath = '') {
            const folderName = await showInputDialog('Nome da Nova Pasta');
            if (folderName) {
                fetch('/create-folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ parentPath, folderName })
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    loadFolders(parentPath);
                })
                .catch(() => alert('Erro ao criar pasta'));
            }
        }

        async function createFile(parentPath = '') {
            const fileName = await showInputDialog('Nome do Novo Arquivo');
            if (fileName) {
                fetch('/create-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ parentPath, fileName })
                })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    loadFolders(parentPath);
                })
                .catch(() => alert('Erro ao criar arquivo'));
            }
        }

        function openFolder(path) {
            fetch(`/list-folders?dir=${encodeURIComponent(path)}`)
                .then(response => response.json())
                .then(folders => {
                    const windowEl = document.createElement('div');
                    windowEl.className = 'window';
                    windowEl.style.left = '100px';
                    windowEl.style.top = '100px';
                    windowEl.innerHTML = `
                        <div class="window-header">
                            <span>${path}</span>
                            <div>
                                <button onclick="createFolder('${path}')">Nova Pasta</button>
                                <button onclick="createFile('${path}')">Novo Arquivo</button>
                                <button onclick="closeWindow(this)">X</button>
                            </div>
                        </div>
                        <div class="window-content">
                            ${folders.map(item => `
                                <div class="folder" onclick="${item.type === '📁' ? `openFolder('${item.path}')` : ''}">
                                    <div class="folder-icon">${item.type}</div>
                                    <div class="folder-name">${item.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    document.body.appendChild(windowEl);
                });
        }

        function showDesktopContextMenu(event) {
            event.preventDefault();
            const contextMenu = document.getElementById('contextMenu');
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.display = 'block';
        }

        function hideContextMenu() {
            const contextMenu = document.getElementById('contextMenu');
            contextMenu.style.display = 'none';
        }

        document.body.addEventListener('click', hideContextMenu);
        initializeApp();