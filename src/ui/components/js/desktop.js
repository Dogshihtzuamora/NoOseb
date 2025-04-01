// janela de gerenciamento do sistema
const windowManager = {
    windows: [],
    nextZIndex: 100,
    activeWindow: null,

    createWindow(app, title, content, x = 100, y = 100, width = 400, height = 300) {
        // Cria um novo elemento de janela
        const windowId = `window-${Date.now()}`;
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = windowId;
        windowEl.style.width = `${width}px`;
        windowEl.style.height = `${height}px`;
        windowEl.style.left = `${x}px`;
        windowEl.style.top = `${y}px`;
        windowEl.style.zIndex = this.nextZIndex++;
        
        // Cria estrutura da janela
        windowEl.innerHTML = `
            <div class="window-header">
                <div class="window-title">${title}</div>
                <div class="window-controls">
                    <div class="window-control window-minimize" title="Minimizar">_</div>
                    <div class="window-control window-maximize" title="Maximizar">□</div>
                    <div class="window-control window-close" title="Fechar">×</div>
                </div>
            </div>
            <div class="window-menu">
                <div class="window-menu-item">Arquivo</div>
                <div class="window-menu-item">Editar</div>
                <div class="window-menu-item">Exibir</div>
                <div class="window-menu-item">Ajuda</div>
            </div>
            <div class="window-content">${content}</div>
            <div class="window-status">Pronto</div>
        `;
        
        document.getElementById('desktop').appendChild(windowEl);
        
        // Adicionar janela ao array de janelas
        const windowObj = {
            id: windowId,
            app: app,
            title: title,
            element: windowEl,
            minimized: false,
            maximized: false,
            originalDimensions: {
                width: width,
                height: height,
                x: x,
                y: y
            }
        };
        
        this.windows.push(windowObj);
        this.setupWindowEvents(windowObj);
        this.addTaskbarItem(windowObj);
        this.activateWindow(windowObj);
        
        return windowObj;
    },
    
    setupWindowEvents(windowObj) {
        const windowEl = windowObj.element;
        const header = windowEl.querySelector('.window-header');
        const minimizeBtn = windowEl.querySelector('.window-minimize');
        const maximizeBtn = windowEl.querySelector('.window-maximize');
        const closeBtn = windowEl.querySelector('.window-close');
        
        // Torna a janela arrastável
        let isDragging = false;
        let offsetX, offsetY;
        
        header.addEventListener('mousedown', (e) => {
            if (windowObj.maximized) return;
            
            isDragging = true;
            offsetX = e.clientX - windowEl.getBoundingClientRect().left;
            offsetY = e.clientY - windowEl.getBoundingClientRect().top;
            
            // Atualiza posição da janela
            this.activateWindow(windowObj);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            windowEl.style.left = `${x}px`;
            windowEl.style.top = `${y}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            
            // Salva posição da janela no localStorage
            if (!windowObj.maximized && !windowObj.minimized) {
                this.saveWindowPosition(windowObj);
            }
        });
        
        // Controle da janela
        minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowObj));
        maximizeBtn.addEventListener('click', () => this.toggleMaximizeWindow(windowObj));
        closeBtn.addEventListener('click', () => this.closeWindow(windowObj));
        
        // Abre a janela quando clicada
        windowEl.addEventListener('mousedown', () => this.activateWindow(windowObj));
    },
    
    activateWindow(windowObj) {
        // Desativa a janela ativa
        if (this.activeWindow) {
            this.activeWindow.element.style.zIndex = this.nextZIndex++;
            const taskItem = document.getElementById(`task-${this.activeWindow.id}`);
            if (taskItem) taskItem.classList.remove('active');
        }
        
        // Ativa uma nova janela
        windowObj.element.style.zIndex = this.nextZIndex++;
        this.activeWindow = windowObj;
        
        // Atualiza barra de tarefas
        const taskItem = document.getElementById(`task-${windowObj.id}`);
        if (taskItem) taskItem.classList.add('active');
        
        // Restaura a janela
        if (windowObj.minimized) {
            this.restoreWindow(windowObj);
        }
    },
    
    minimizeWindow(windowObj) {
        windowObj.element.style.display = 'none';
        windowObj.minimized = true;
        
        // Atualiza barra de tarefas
        const taskItem = document.getElementById(`task-${windowObj.id}`);
        if (taskItem) taskItem.classList.remove('active');
    },
    
    restoreWindow(windowObj) {
        windowObj.element.style.display = 'flex';
        windowObj.minimized = false;
        
        // Atualiza barra de tarefas
        const taskItem = document.getElementById(`task-${windowObj.id}`);
        if (taskItem) taskItem.classList.add('active');
    },
    
    toggleMaximizeWindow(windowObj) {
        if (windowObj.maximized) {
            // Restaura tamanho original
            windowObj.element.style.top = `${windowObj.originalDimensions.y}px`;
            windowObj.element.style.left = `${windowObj.originalDimensions.x}px`;
            windowObj.element.style.width = `${windowObj.originalDimensions.width}px`;
            windowObj.element.style.height = `${windowObj.originalDimensions.height}px`;
            windowObj.maximized = false;
        } else {
            // Salva dimensões originais
            windowObj.originalDimensions = {
                width: windowObj.element.offsetWidth,
                height: windowObj.element.offsetHeight,
                x: windowObj.element.offsetLeft,
                y: windowObj.element.offsetTop
            };
            
            // Maximiza a janela
            const desktop = document.getElementById('desktop');
            windowObj.element.style.top = '0';
            windowObj.element.style.left = '0';
            windowObj.element.style.width = `${desktop.offsetWidth}px`;
            windowObj.element.style.height = `${desktop.offsetHeight}px`;
            windowObj.maximized = true;
        }
    },
    
    closeWindow(windowObj) {
        // remove do DOM
        windowObj.element.remove();
        
        // Remove da lista de janelas
        const index = this.windows.findIndex(w => w.id === windowObj.id);
        if (index !== -1) {
            this.windows.splice(index, 1);
        }
        
        // Remove itens da barra de tarefas
        const taskItem = document.getElementById(`task-${windowObj.id}`);
        if (taskItem) taskItem.remove();
        
        // configura nova janela ativa
        if (this.activeWindow && this.activeWindow.id === windowObj.id) {
            this.activeWindow = null;
            if (this.windows.length > 0) {
                this.activateWindow(this.windows[this.windows.length - 1]);
            }
        }
    },
    
    addTaskbarItem(windowObj) {
        const taskbarItems = document.getElementById('taskbar-items');
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.id = `task-${windowObj.id}`;
        taskItem.innerHTML = `${windowObj.title}`;
        
        taskItem.addEventListener('click', () => {
            if (this.activeWindow && this.activeWindow.id === windowObj.id && !windowObj.minimized) {
                this.minimizeWindow(windowObj);
            } else {
                this.activateWindow(windowObj);
            }
        });
        
        taskbarItems.appendChild(taskItem);
    },
    
    saveWindowPosition(windowObj) {
        const windowPositions = JSON.parse(localStorage.getItem('windowPositions') || '{}');
        windowPositions[windowObj.app] = {
            x: windowObj.element.offsetLeft,
            y: windowObj.element.offsetTop,
            width: windowObj.element.offsetWidth,
            height: windowObj.element.offsetHeight
        };
        localStorage.setItem('windowPositions', JSON.stringify(windowPositions));
    },
    
    loadWindowPosition(app) {
        const windowPositions = JSON.parse(localStorage.getItem('windowPositions') || '{}');
        return windowPositions[app] || null;
    }
};

// gerenciador
const appManager = {
    openApp(appName) {
        // Fecha o menu inicial
        toggleStartMenu(false);
        
        // verifica se o app está aberto
        const existingWindow = windowManager.windows.find(w => w.app === appName);
        if (existingWindow) {
            windowManager.activateWindow(existingWindow);
            return;
        }
        
        // obtem posivcao salva
        const savedPosition = windowManager.loadWindowPosition(appName);
        const x = savedPosition ? savedPosition.x : 100 + Math.random() * 100;
        const y = savedPosition ? savedPosition.y : 100 + Math.random() * 100;
        const width = savedPosition ? savedPosition.width : 500;
        const height = savedPosition ? savedPosition.height : 400;
        
        // abre o app baseado no nome
        switch (appName) {
            case 'fileExplorer':
                this.openFileExplorer(x, y, width, height);
                break;
            case 'terminal':
                this.openTerminal(x, y, width, height);
                break;
            case 'notepad':
                this.openNotepad(x, y, width, height);
                break;
            case 'myComputer':
                this.openMyComputer(x, y, width, height);
                break;
        }
    },
    
    openFileExplorer(x, y, width, height) {
        const content = `
            <div class="file-explorer-content">
                <div class="file-explorer-toolbar">
                    <div class="toolbar-button">Voltar</div>
                    <div class="toolbar-button">Avançar</div>
                    <div class="toolbar-button">Acima</div>
                    <div class="toolbar-button">Excluir</div>
                </div>
                <div class="file-explorer-address">
                    <span class="address-label">Endereço:</span>
                    <div class="address-bar">C:\\</div>
                </div>
                <div class="file-explorer-files" id="explorer-files">
                    <!-- Files will be added dynamically -->
                </div>
            </div>
        `;
        
        const window = windowManager.createWindow('fileExplorer', 'Explorador de Arquivos', content, x, y, width, height);
        
        // adiciona aquivos simples
        const filesContainer = window.element.querySelector('#explorer-files');
        
        const fileTypes = [
            { name: 'Documentos', icon: 'folder' },
            { name: 'Imagens', icon: 'folder' },
            { name: 'Músicas', icon: 'folder' },
            { name: 'Vídeos', icon: 'folder' },
            { name: 'readme.txt', icon: 'text' },
            { name: 'config.ini', icon: 'text' }
        ];
        
        fileTypes.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            let iconSrc = '';
            if (file.icon === 'folder') {
                iconSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRYhe3WMQrCMBTG8X9dXDyBJ/EGHsEbeAZP4QE8gFfw1sUruDm7uLk5uSqCdmgTmmApNK95Kb4fhEDIx0teXgj8+XUmwBbogCtwAB5vrAN2wKzPcAZcIuEh1wVY9BFfAXXC+JBrEfNxKfzlWsZ8XAp/uVYxH5fCX65NzMel8JdrG/NxKfzl2sd8XAp/uQ4xH5fCX65TzMel8JeryfnYFP5y3XM+NoW/XG3Ox6bwl+uR87Ep/OV65nxsCn+5upyPTeEv1zvnY1P4yzXK+dgU/nKNcj42hb9co5yPTfHzegKl5YrYC760YAAAAABJRU5ErkJggg==';
            } else if (file.icon === 'text') {
                iconSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAA1UlEQVRYhe3WsQrCMBSF4T/qIj6Bk2/gI/gGPoNP4QP4AL6Cb+Dm7OLm5uSqKHYIbUgcWmxyU+gPgUBCziFwbwL8+XUmwBZogQtwAB4frwbYAbM+w1PgGgkPuS7Aos/4CqgTxodci5iPS+Ev1zLm41L4y7WK+bgU/nJtYj4uhb9c25iPS+Ev1z7m41L4y3WI+bgU/nKdYj4uhb9cTc7HpvCXq835uBQjYJ8Qvgfm3xZYANeE8BswTwFPgVNC+BmYpoAnwDEh/ABMUsCTv9ZLAU/+Wi8FvAJKyxWxF3xpwQAAAABJRU5ErkJggg==';
            }
            
            fileItem.innerHTML = `
                <img src="${iconSrc}" class="file-icon" alt="${file.name}">
                <span>${file.name}</span>
            `;
            
            filesContainer.appendChild(fileItem);
        });
        
        //adiciona contexto ao menu
        filesContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY);
        });
        
        // adiciona clique ao selecionar um arquivo
        filesContainer.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                // nao seleciona nenhum arquivo
                filesContainer.querySelectorAll('.file-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // seleciona o arquivo clicado
                fileItem.classList.add('selected');
            }
        });
    },
    
    openTerminal(x, y, width, height) {
        const content = `
            <div class="terminal-content" id="terminal-content">
                <div>Microsoft Windows [Versão 4.00.950]</div>
                <div>(C) Copyright Microsoft Corp 1981-1996.</div>
                <div>&nbsp;</div>
                <div class="terminal-input">
                    <span class="terminal-prompt">C:\\&gt;</span>
                    <input type="text" class="terminal-command" id="terminal-command">
                </div>
            </div>
        `;
        
        const window = windowManager.createWindow('terminal', 'Terminal', content, x, y, width, height);
        
        // MS-DOS
        const terminalContent = window.element.querySelector('#terminal-content');
        const commandInput = window.element.querySelector('#terminal-command');
        
        commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = commandInput.value.trim();
                
                // Add command to terminal output
                const commandLine = document.createElement('div');
                commandLine.innerHTML = `<span class="terminal-prompt">C:\\&gt;</span> ${command}`;
                terminalContent.insertBefore(commandLine, terminalContent.lastChild);
                
                // Process command
                let response = '';
                if (command.toLowerCase() === 'help') {
                    response = 'Comandos disponíveis: dir, cls, echo, ver, date, time, help';
                } else if (command.toLowerCase() === 'dir') {
                    response = 'Diretório de C:\\\n\n' +
                        '31/03/2025  13:15    &lt;DIR&gt;          Windows\n' +
                        '31/03/2025  13:15    &lt;DIR&gt;          Documentos\n' +
                        '31/03/2025  13:15    &lt;DIR&gt;          Programas\n' +
                        '31/03/2024  13:15             512 config.sys\n' +
                        '31/03/2025  13:15             512 autoexec.bat\n' +
                        '               2 arquivo(s)           1.024 bytes\n' +
                        '               3 pasta(s)   540.000.000 bytes livres';
                } else if (command.toLowerCase() === 'cls') {
                    
                    terminalContent.innerHTML = '';
                    terminalContent.appendChild(commandLine.cloneNode(true));
                    
               
                    const inputLine = document.createElement('div');
                    inputLine.className = 'terminal-input';
                    inputLine.innerHTML = '<span class="terminal-prompt">C:\\&gt;</span>';
                    inputLine.appendChild(commandInput);
                    terminalContent.appendChild(inputLine);
                    
                    commandInput.value = '';
                    commandInput.focus();
                    return;
                } else if (command.toLowerCase().startsWith('echo ')) {
                    response = command.substring(5);
                } else if (command.toLowerCase() === 'ver') {
                    response = 'Microsoft Windows [Versão 0.00.000]';
                } else if (command.toLowerCase() === 'date') {
                    response = 'A data atual é 31/03/2025';
                } else if (command.toLowerCase() === 'time') {
                    response = 'A hora atual é 13:15:00,00';
                } else if (command.trim() === '') {
                    response = '';
                } else {
                    response = `'${command}' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes.`;
                }
                
     
                if (response) {
                    const responseLines = response.split('\n');
                    responseLines.forEach(line => {
                        const responseLine = document.createElement('div');
                        responseLine.textContent = line;
                        terminalContent.insertBefore(responseLine, terminalContent.lastChild);
                    });
                }
                
             
                commandInput.value = '';
                
           
                terminalContent.scrollTop = terminalContent.scrollHeight;
            }
        });
        
  
        setTimeout(() => {
            commandInput.focus();
        }, 100);
    },
    
    openNotepad(x, y, width, height) {
        const content = `
            <textarea style="width: 100%; height: 100%; resize: none; border: none; padding: 5px; font-family: 'Courier New', monospace; font-size: 12px; outline: none;"></textarea>
        `;
        
        windowManager.createWindow('notepad', 'Bloco de Notas - Sem título', content, x, y, width, height);
    },
    
    openMyComputer(x, y, width, height) {
        const content = `
            <div class="file-explorer-content">
                <div class="file-explorer-toolbar">
                    <div class="toolbar-button">Voltar</div>
                    <div class="toolbar-button">Acima</div>
                    <div class="toolbar-button">Propriedades</div>
                </div>
                <div class="file-explorer-address">
                    <span class="address-label">Endereço:</span>
                    <div class="address-bar">Meu Computador</div>
                </div>
                <div class="file-explorer-files">
                    <div class="file-item">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRYhe3WMQrCMBTG8X9dXDyBJ/EGHsEbeAZP4QE8gFfw1sUruDm7uLk5uSqCdmgTmmApNK95Kb4fhEDIx0teXgj8+XUmwBbogCtwAB5vrAN2wKzPcAZcIuEh1wVY9BFfAXXC+JBrEfNxKfzlWsZ8XAp/uVYxH5fCX65NzMel8JdrG/NxKfzl2sd8XAp/uQ4xH5fCX65TzMel8JeryfnYFP5y3XM+NoW/XG3Ox6bwl+uR87Ep/OV65nxsCn+5upyPTeEv1zvnY1P4yzXK+dgU/nKNcj42hb9co5yPTfHzegKl5YrYC760YAAAAABJRU5ErkJggg==" class="file-icon" alt="Disco Local (C:)">
                        <span>Disco Local (C:)</span>
                    </div>
                    <div class="file-item">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRYhe3WMQrCMBTG8X9dXDyBJ/EGHsEbeAZP4QE8gFfw1sUruDm7uLk5uSqCdmgTmmApNK95Kb4fhEDIx0teXgj8+XUmwBbogCtwAB5vrAN2wKzPcAZcIuEh1wVY9BFfAXXC+JBrEfNxKfzlWsZ8XAp/uVYxH5fCX65NzMel8JdrG/NxKfzl2sd8XAp/uQ4xH5fCX65TzMel8JeryfnYFP5y3XM+NoW/XG3Ox6bwl+uR87Ep/OV65nxsCn+5upyPTeEv1zvnY1P4yzXK+dgU/nKNcj42hb9co5yPTfHzegKl5YrYC760YAAAAABJRU5ErkJggg==" class="file-icon" alt="Unidade de CD-ROM (D:)">
                        <span>CD-ROM (D:)</span>
                    </div>
                    <div class="file-item">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRYhe3WMQrCMBTG8X9dXDyBJ/EGHsEbeAZP4QE8gFfw1sUruDm7uLk5uSqCdmgTmmApNK95Kb4fhEDIx0teXgj8+XUmwBbogCtwAB5vrAN2wKzPcAZcIuEh1wVY9BFfAXXC+JBrEfNxKfzlWsZ8XAp/uVYxH5fCX65NzMel8JdrG/NxKfzl2sd8XAp/uQ4xH5fCX65TzMel8JeryfnYFP5y3XM+NoW/XG3Ox6bwl+uR87Ep/OV65nxsCn+5upyPTeEv1zvnY1P4yzXK+dgU/nKNcj42hb9co5yPTfHzegKl5YrYC760YAAAAABJRU5ErkJggg==" class="file-icon" alt="Painel de Controle">
                        <span>Painel de Controle</span>
                    </div>
                    <div class="file-item">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRYhe3WMQrCMBTG8X9dXDyBJ/EGHsEbeAZP4QE8gFfw1sUruDm7uLk5uSqCdmgTmmApNK95Kb4fhEDIx0teXgj8+XUmwBbogCtwAB5vrAN2wKzPcAZcIuEh1wVY9BFfAXXC+JBrEfNxKfzlWsZ8XAp/uVYxH5fCX65NzMel8JdrG/NxKfzl2sd8XAp/uQ4xH5fCX65TzMel8JeryfnYFP5y3XM+NoW/XG3Ox6bwl+uR87Ep/OV65nxsCn+5upyPTeEv1zvnY1P4yzXK+dgU/nKNcj42hb9co5yPTfHzegKl5YrYC760YAAAAABJRU5ErkJggg==" class="file-icon" alt="Impressoras">
                        <span>Impressoras</span>
                    </div>
                </div>
            </div>
        `;
        
        windowManager.createWindow('myComputer', 'Meu Computador', content, x, y, width, height);
    }
};


function showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';
    

    document.addEventListener('click', hideContextMenu);
}

function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'none';
    

    document.removeEventListener('click', hideContextMenu);
}

function toggleStartMenu(show) {
    const startMenu = document.getElementById('start-menu');
    if (show === undefined) {
        startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
    } else {
        startMenu.style.display = show ? 'block' : 'none';
    }
}


function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}`;
}


function init() {
 
    document.querySelectorAll('.icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const app = icon.getAttribute('data-app');
            appManager.openApp(app);
        });
    });
    

    document.getElementById('start-button').addEventListener('click', () => {
        toggleStartMenu();
    });
    

    document.querySelectorAll('.start-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const app = item.getAttribute('data-app');
            const action = item.getAttribute('data-action');
            
            if (app) {
                appManager.openApp(app);
            } else if (action === 'shutdown') {
                alert('O sistema será encerrado agora.');
            }
            
            toggleStartMenu(false);
        });
    });
    

    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            
            if (action === 'new-folder') {
                alert('Criando nova pasta...');
            } else if (action === 'new-file') {
                alert('Criando novo arquivo...');
            } else if (action === 'refresh') {
                alert('Atualizando...');
            } else if (action === 'properties') {
                alert('Propriedades...');
            }
        });
    });
    

    document.addEventListener('contextmenu', (e) => {
    u
        e.preventDefault();
        

        showContextMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#context-menu')) {
            hideContextMenu();
        }
    });
    

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
            toggleStartMenu(false);
        }
    });
    
    updateClock();
    setInterval(updateClock, 60000);
    

    document.getElementById('desktop').addEventListener('contextmenu', (e) => {
        if (!e.target.closest('.window') && !e.target.closest('#taskbar')) {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY);
        }
    });
}

const Kernel = {
    files: {},
    
    createFolder(path, name) {
        const fullPath = path ? `${path}/${name}` : name;
        this.files[fullPath] = {
            type: 'folder',
            name: name,
            path: path,
            children: []
        };
        return fullPath;
    },
    
    createFile(path, name, content = '') {
        const fullPath = path ? `${path}/${name}` : name;
        this.files[fullPath] = {
            type: 'file',
            name: name,
            path: path,
            content: content
        };
        return fullPath;
    },
    
    getContents(path) {
        const result = [];
        
        for (const filePath in this.files) {
            const file = this.files[filePath];
            if (file.path === path) {
                result.push(file);
            }
        }
        
        return result;
    },
    
    deleteItem(path) {
        if (this.files[path]) {
            delete this.files[path];
            
   
            if (this.files[path] && this.files[path].type === 'folder') {
                for (const filePath in this.files) {
                    if (filePath.startsWith(`${path}/`)) {
                        delete this.files[filePath];
                    }
                }
            }
            
            return true;
        }
        return false;
    },
    
    renameItem(path, newName) {
        if (this.files[path]) {
            const file = this.files[path];
            const newPath = file.path ? `${file.path}/${newName}` : newName;
            
            this.files[newPath] = {
                ...file,
                name: newName
            };
            

            delete this.files[path];
            
            return newPath;
        }
        return null;
    },
    
    moveItem(sourcePath, destPath) {
        if (this.files[sourcePath] && this.files[destPath] && this.files[destPath].type === 'folder') {
            const file = this.files[sourcePath];
            const newPath = `${destPath}/${file.name}`;
            

            this.files[newPath] = {
                ...file,
                path: destPath
            };
            

            delete this.files[sourcePath];
            
            return newPath;
        }
        return null;
    },
    
    saveToLocalStorage() {
        localStorage.setItem('win95Kernel', JSON.stringify(this.files));
    },
    
    loadFromLocalStorage() {
        const savedFiles = localStorage.getItem('win95Kernel');
        if (savedFiles) {
            this.files = JSON.parse(savedFiles);
        } else {
            // Inicializar com alguns arquivos padrão
            this.createFolder('', 'Documentos');
            this.createFolder('', 'Imagens');
            this.createFile('', 'readme.txt', 'Bem-vindo ao NoOseb!');
        }
    }
};

// Inicializar o aplicativo
document.addEventListener('DOMContentLoaded', () => {
    init();
    Kernel.loadFromLocalStorage();
});