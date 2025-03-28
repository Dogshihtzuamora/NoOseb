## 📌 Resumo da Arquitetura do SO

### 🔹 Kernel e Bootloader
- **Kernel**: **Minix 3** (Leve, seguro, baseado em microkernel)
- **Bootloader**: **GRUB** (Carrega o Minix 3 e inicia a interface gráfica)

### 🔹 Interface Gráfica (Desktop)
- **Framework**: **Electron.js** (Criação da interface e dos aplicativos)
- **Gerenciador de Janelas**: Interface baseada em Electron, similar ao **Webtop**
- **Sistema de Ícones/Menu**: Escritos em **HTML, CSS, JavaScript**

### 🔹 Gerenciamento de Aplicativos
- **Gerenciador de Pacotes**: **Flatpak** (Instalação de aplicativos e dependências)
- **Aplicativos**: Escritos em **HTML, CSS e JavaScript** (Rodando via Electron)

### 🔹 Suporte a Programas `.exe`
- **Wine** (Permite rodar programas Windows diretamente no SO)
- **Integração**: Wine pode ser embutido em aplicativos Flatpak

### 🔹 Sistema de Arquivos
- **Minix FS** (Sistema de arquivos nativo do Minix 3)
- **Acesso via API JS** (Gerenciamento de arquivos exposto via Node.js)

### 🔹 APIs do Sistema
- **Node.js** (Executado no SO, fornece APIs para JS interagir com o hardware)
- **APIs Disponíveis**:
  - `navigator.system.runCommand("ls -l")` → Executar comandos do sistema
  - `navigator.system.readFile("/home/user/file.txt")` → Ler arquivos
  - `navigator.system.writeFile("/home/user/newfile.txt", "data")` → Escrever arquivos

### 🔹 Terminal e Linha de Comando
- **Shell baseado em JavaScript** (Executado via Node.js)
- **Comandos escritos em JS**:
  ```js
  system.exec("echo 'Hello, World!'");
  ```
- **Modo Interativo**: O terminal aceita scripts JavaScript

---

## 🔹 Fluxo de Inicialização
1️⃣ **GRUB** inicia o **Minix 3**  
2️⃣ Minix carrega o **Node.js** como backend do SO  
3️⃣ O **Electron.js** inicia a interface gráfica  
4️⃣ O terminal **JS Shell** fica disponível para comandos  

---

## 🔹 Recursos e Vantagens
✅ **Sistema leve e modular** (Microkernel Minix 3)  
✅ **Interface moderna** (Baseada em tecnologias web)  
✅ **Compatibilidade com Windows** (Via Wine)  
✅ **Gerenciador de pacotes eficiente** (Flatpak)  
✅ **APIs JS para controle total do sistema**  

---

### 🚀 Próximos Passos
- Criar a **interface do desktop** com Electron.js
- Implementar o **terminal JS** para interação com o sistema
- Integrar **Flatpak** e **Wine** ao ambiente
