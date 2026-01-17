o facilitate the extraction and recreation of this design system by an AI agent like Codex, I have structured the frontend artifacts into a comprehensive, componentized document.

This document uses CSS Custom Properties (Variables) for design tokens and BEM-like naming conventions for HTML/CSS structure. All labels are in Portuguese (Brazil).

1. Design Tokens (Design System Metadata)
:root {
  /* Colors */
  --color-primary: #FFC107;      /*   Yellow */
  --color-primary-hover: #EBB006;
  --color-navy: #005696;         /*   Navy */
  --color-navy-dark: #003D6B;
  --color-bg: #F5F7FA;           /* App Background */
  --color-surface: #FFFFFF;      /* Card/Modal Background */
  --color-border: #E0E0E0;       /* Divider/Border */
  --color-text-main: #212121;
  --color-text-secondary: #616161;
  --color-success: #28A745;
  --color-error: #DC3545;
  --color-warning: #FF9800;

  /* Typography */
  --font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-size-h1: 24px;
  --font-size-h2: 18px;
  --font-size-body: 14px;
  --font-size-small: 12px;
  --font-weight-bold: 700;
  --font-weight-regular: 400;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Elevation & Rounding */
  --radius-md: 8px;
  --radius-sm: 4px;
  --shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-modal: 0 10px 25px rgba(0, 0, 0, 0.2);
}
2. Components
<!-- Primary Action -->
<button class="btn btn--primary">EXECUTAR AGORA</button>
<!-- Secondary Action -->
<button class="btn btn--secondary">CANCELAR</button>
<!-- Ghost/Link Action -->
<button class="btn btn--ghost">EDITAR</button>
.btn {
  font-family: var(--font-family);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-small);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  text-transform: uppercase;
}
.btn--primary {
  background-color: var(--color-primary);
  color: var(--color-navy);
}
.btn--primary:hover { background-color: var(--color-primary-hover); }
.btn--primary:active { transform: translateY(1px); }
.btn--primary:disabled { background-color: #EEE; color: #AAA; cursor: not-allowed; }

.btn--secondary {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
}
.btn--secondary:hover { background-color: #FAFAFA; }

.btn--ghost {
  background-color: transparent;
  color: var(--color-navy);
  padding: 5px 10px;
}
.btn--ghost:hover { text-decoration: underline; }
<div class="card">
  <div class="card__header">
    <span class="badge badge--success">ATIVO</span>
    <h3 class="card__title">Conciliação Bancária</h3>
  </div>
  <div class="card__body">
    <p>Processo diário de automação de extratos.</p>
  </div>
  <div class="card__footer">
    <button class="btn btn--ghost">EDITAR</button>
    <button class="btn btn--primary">EXECUTAR</button>
  </div>
</div>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-subtle);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.card__title {
  color: var(--color-navy);
  font-size: var(--font-size-h2);
  margin: 0;
}
.badge {
  font-size: 10px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
}
.badge--success { background: #E8F5E9; color: var(--color-success); }
.badge--error { background: #FFEBEE; color: var(--color-error); }
3. Screen Structure (Assembled)
<div class="app-layout">
  <!-- Top Bar -->
  <header class="topbar">
    <div class="topbar__logo">  <span>Automation</span></div>
    <nav class="topbar__nav">
      <a href="#" class="nav-item nav-item--active">Planos</a>
      <a href="#" class="nav-item">Exemplos</a>
      <a href="#" class="nav-item">Execuções</a>
      <a href="#" class="nav-item">Relatórios</a>
    </nav>
  </header>

  <!-- Main Content -->
  <main class="content">
    <div class="content__header">
      <h1>Cenários</h1>
      <button class="btn btn--primary">+ NOVA AUTOMAÇÃO</button>
    </div>
    
    <div class="filter-bar">
      <input type="text" class="input" placeholder="Filtrar por nome...">
      <select class="select">
        <option>Todos os Status</option>
      </select>
    </div>

    <div class="grid">
      <!-- Cards injected here -->
    </div>
  </main>
</div>
.app-layout { background-color: var(--color-bg); min-height: 100vh; }
.topbar { 
  background-color: var(--color-navy); 
  color: white; 
  padding: 0 var(--spacing-lg);
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-item { color: rgba(255,255,255,0.7); text-decoration: none; padding: 20px; }
.nav-item--active { color: white; border-bottom: 3px solid var(--color-primary); }
.content { padding: var(--spacing-xl); }
.grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: var(--spacing-lg); 
  margin-top: var(--spacing-lg);
}
4. Overlays
<div class="modal-overlay">
  <div class="modal">
    <div class="modal__header">
      <h2>full-flow</h2>
      <button class="modal__close">&times;</button>
    </div>
    <div class="modal__body">
      <div class="form-group">
        <label>Env prefix</label>
        <input type="text" class="input" value="AUTO_">
      </div>
      <div class="section">
        <h4>DEFAULTS</h4>
        <div class="empty-state">Sem defaults.</div>
      </div>
    </div>
    <div class="modal__footer">
      <button class="btn btn--secondary">FECHAR</button>
      <button class="btn btn--primary">RODAR AGORA</button>
    </div>
  </div>
</div>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 61, 107, 0.6); /* Navy semi-transparent */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--color-surface);
  width: 600px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-modal);
  overflow: hidden;
}
.modal__header { padding: var(--spacing-md); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; }
.modal__body { padding: var(--spacing-lg); max-height: 70vh; overflow-y: auto; }
.modal__footer { padding: var(--spacing-md); background: #F9F9F9; display: flex; justify-content: flex-end; gap: var(--spacing-sm); }
5. Interaction Hints
Nav Trigger: Clicking .nav-item re-renders the .grid with specific module components.
Run Trigger: Clicking btn--primary on a card triggers the modal-overlay.
Form State: .input:focus should apply border-color: var(--color-navy).

6. Raw UI Components and Workflow Examples 
<!-- Listagem de Automações -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Listagem de Automações -   Internal</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#005EB8", //   Blue
                        "brand-yellow": "#FFD100", //   Yellow
                        "brand-green": "#68A55D", // Accent Green from image
                        "background-light": "#F4F6F8",
                        "background-dark": "#0F172A",
                        "surface-light": "#FFFFFF",
                        "surface-dark": "#1E293B",
                    },
                    fontFamily: {
                        display: ["Roboto", "sans-serif"],
                        body: ["Roboto", "sans-serif"],
                    },
                    boxShadow: {
                        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    }
                },
            },
        };
    </script>
<style>::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent; 
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1; 
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8; 
        }
        .dark ::-webkit-scrollbar-thumb {
            background: #475569; 
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-gray-700 dark:text-gray-200 font-body antialiased h-screen flex overflow-hidden transition-colors duration-200">
<aside class="w-64 flex-shrink-0 bg-primary flex flex-col shadow-xl z-20">
<div class="h-16 flex items-center px-6 bg-primary border-b border-blue-600">
<div class="flex items-center gap-2">
<div class="w-8 h-8 bg-brand-yellow rounded-sm flex items-center justify-center text-primary font-bold text-xl">B</div>
<span class="text-white font-bold text-lg tracking-tight"> <span class="font-light opacity-80">Ops</span></span>
</div>
</div>
<nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
<a class="flex items-center gap-3 px-3 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-md transition-colors" href="#">
<span class="material-icons-outlined text-[20px]">dashboard</span>
<span class="text-sm font-medium">Dashboard</span>
</a>
<a class="flex items-center gap-3 px-3 py-3 bg-brand-yellow text-primary rounded-md shadow-sm transition-colors font-bold" href="#">
<span class="material-icons-outlined text-[20px]">smart_toy</span>
<span class="text-sm">Automações</span>
</a>
<a class="flex items-center gap-3 px-3 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-md transition-colors" href="#">
<span class="material-icons-outlined text-[20px]">toc</span>
<span class="text-sm font-medium">Fila de Processos</span>
</a>
<a class="flex items-center gap-3 px-3 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-md transition-colors" href="#">
<span class="material-icons-outlined text-[20px]">history</span>
<span class="text-sm font-medium">Histórico</span>
</a>
<a class="flex items-center gap-3 px-3 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-md transition-colors" href="#">
<span class="material-icons-outlined text-[20px]">description</span>
<span class="text-sm font-medium">Logs de Sistema</span>
</a>
<a class="flex items-center gap-3 px-3 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-md transition-colors" href="#">
<span class="material-icons-outlined text-[20px]">verified</span>
<span class="text-sm font-medium">Aprovações</span>
</a>
</nav>
<div class="p-3 border-t border-blue-600">
<a class="flex items-center gap-3 px-3 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-md transition-colors" href="#">
<span class="material-icons-outlined text-[20px]">settings</span>
<span class="text-sm font-medium">Configurações</span>
</a>
</div>
</aside>
<div class="flex-1 flex flex-col relative min-w-0">
<header class="h-16 bg-surface-light dark:bg-surface-dark shadow-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-10">
<div class="flex-1 max-w-lg">
<div class="relative">
<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<span class="material-icons-outlined text-gray-400">search</span>
</span>
<input class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-colors" placeholder="Buscar automação..." type="text"/>
</div>
</div>
<div class="flex items-center gap-4">
<button class="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-brand-yellow transition-colors relative">
<span class="material-icons-outlined">notifications</span>
<span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
</button>
<div class="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
<div class="flex items-center gap-3 cursor-pointer">
<div class="text-right hidden sm:block">
<p class="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
<p class="text-xs text-gray-500 dark:text-gray-400">DevOps Team</p>
</div>
<img alt="User Profile" class="h-9 w-9 rounded-full border-2 border-white dark:border-gray-600 shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRwh5S1nwISL5zyvmW-DC0OdNIcSXsDskZR9W3BGOuRmjhue8OVFz6ime-6NdFEIOzFNzxiB0Ap9Q7R-SovTXhMF96MCAkMnQx73oO3QJrOrfs_RJifTDT7Y59qaw1f9eBqjgi32SaRYN-DPNlS7DePajqTpUBXwvoIx52a_cN8jQu4C9aP8mnL3SMjE_p_I-OE3bfyLhCHChOqIIR0cGCrH79ZBCSsbdfsGK1YtQ3ewQ88MVvztyRyTgpocExwy7K-KLQBQKVR20h"/>
</div>
</div>
</header>
<main class="flex-1 overflow-y-auto p-6 lg:p-10">
<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
<div>
<h1 class="text-3xl font-bold text-primary dark:text-white tracking-tight">Automações</h1>
<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Gerencie e monitore seus processos automatizados.</p>
</div>
<button class="bg-brand-yellow hover:bg-yellow-400 text-primary font-bold py-2.5 px-6 rounded shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5">
<span class="material-icons-outlined text-xl">add</span>
                    NOVA AUTOMAÇÃO
                </button>
</div>
<div class="bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
<div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
<div class="w-full md:w-48">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Status</label>
<select class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
<option>Todos</option>
<option>Ativos</option>
<option>Em Pausa</option>
<option>Com Erro</option>
</select>
</div>
<div class="w-full md:w-48">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Responsável</label>
<select class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
<option>Qualquer</option>
<option>Financeiro</option>
<option>Marketing</option>
<option>TI</option>
</select>
</div>
</div>
<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
<span>12 automações encontradas</span>
<button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-primary transition-colors">
<span class="material-icons-outlined">refresh</span>
</button>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
<div class="group bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col">
<div class="p-6 flex-1">
<div class="flex justify-between items-start mb-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-200">
                                Financeiro
                            </span>
<span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide">
<span class="w-2 h-2 rounded-full bg-green-500"></span>
                                Ativo
                            </span>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                            Conciliação Bancária Diária
                        </h3>
<p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            Processo automático para baixar extratos e conciliar com lançamentos do ERP SAP.
                        </p>
<div class="flex items-center gap-3 mb-4">
<img alt="Owner" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUBIuJCFgi8USskTDDa2hLiyB7GXeVOBoaX8Ynmf04VTqLejMaDwusUAKepuFnFVDiVgO380EMnf6KZma1N8ecHxvBEwOFMUNdaMMtXcmLjeCvoiGtGq2vL6pJBr3AhC7l-ubH_yvTIRf3rus-DgtgQapK2u6AoDEfvMsNOa3vU_kGtrZvL-CV_URnvTu9QRX9vdD_3SbjBhXsML9yJ9Mznd5ynQ91x0AFpAHyo06jPK-t7dq0PdRsmDXwa9iMGOsmCvB_8c0NOFI4"/>
<span class="text-xs text-gray-500 dark:text-gray-400">Carlos Silva</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Última Execução</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">event_available</span>
                                    Hoje, 08:00
                                </p>
</div>
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Próxima</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">update</span>
                                    Amanhã, 08:00
                                </p>
</div>
</div>
</div>
<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
<button class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-brand-yellow transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">edit</span>
                            EDITAR
                        </button>
<button class="text-sm font-bold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">play_arrow</span>
                            EXECUTAR AGORA
                        </button>
</div>
</div>
<div class="group bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col">
<div class="p-6 flex-1">
<div class="flex justify-between items-start mb-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-200">
                                Marketing
                            </span>
<span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide">
<span class="w-2 h-2 rounded-full bg-green-500"></span>
                                Ativo
                            </span>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                            Disparo de Newsletter Semanal
                        </h3>
<p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            Envio de e-mails para base segmentada com novidades do Blog  .
                        </p>
<div class="flex items-center gap-3 mb-4">
<img alt="Owner" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGCNvMdBZwHgTyjOJ31XzVidyU7bOcjgTw-5NvpufFh47-18dfFRIrCal8adThheq08lErgiIsYrsSOXWqenYCV7i1LDLJ7cu54eYwsS3WCMAuD9W0FJlybcf5b0X6xfltB-YRg6JfK_CRwwaScrW7w01Br4pNGc63ZB7CmhlIN6YubZUwsDSbFfljvGN8fjzoiYMcf8q8CGs2DHenTRWn9MZXxdMefmR4qnx1JocLHRCwL0JYMFSEaEeNSvbaZw-81034FGplTWgM"/>
<span class="text-xs text-gray-500 dark:text-gray-400">Ana Maria</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Última Execução</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">event_available</span>
                                    Ontem, 14:30
                                </p>
</div>
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Próxima</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">update</span>
                                    25/10, 14:30
                                </p>
</div>
</div>
</div>
<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
<button class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-brand-yellow transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">edit</span>
                            EDITAR
                        </button>
<button class="text-sm font-bold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">play_arrow</span>
                            EXECUTAR AGORA
                        </button>
</div>
</div>
<div class="group bg-surface-light dark:bg-surface-dark rounded-lg border border-red-200 dark:border-red-900 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden">
<div class="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
<div class="p-6 flex-1">
<div class="flex justify-between items-start mb-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-200">
                                Integração
                            </span>
<span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wide">
<span class="material-icons-outlined text-[14px]">error</span>
                                Erro
                            </span>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                            Sincronização CRM Salesforce
                        </h3>
<p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            Atualização bidirecional de leads qualificados entre site e Salesforce.
                        </p>
<div class="flex items-center gap-3 mb-4">
<img alt="Owner" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtwZVPA9lpOB5KXjUK4Hpv-i7VtZFmNLQFzAosb3td_x0mxBobUe2pU9vgX0WUf6WNX_EF2nM2Kn8EWRPt2lYXJ5Yvqx50onzINTIeRkv9vJhLn9C4q27kOVgmSYXekaQDMkdfiqKi5AazxpJFI1YQoJKu5-SjobmLesKbHuppT1hBXmHuMmTvWs8OKvtmJAtojU_aRhxxow-Pv3TYuiFtq0iRufRBUQ4NWIUCn4vXsdh10_tGzQu3GkmQcFnCzGAbiTO5F0mdnQ_v"/>
<span class="text-xs text-gray-500 dark:text-gray-400">Roberto Dias</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Última Execução</p>
<p class="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
<span class="material-icons-outlined text-sm">warning</span>
                                    Falhou (30min)
                                </p>
</div>
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Tentativas</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">autorenew</span>
                                    3/5
                                </p>
</div>
</div>
</div>
<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
<button class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-brand-yellow transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">edit</span>
                            EDITAR
                        </button>
<button class="text-sm font-bold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">restart_alt</span>
                            TENTAR NOVAMENTE
                        </button>
</div>
</div>
<div class="group bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col opacity-80 hover:opacity-100">
<div class="p-6 flex-1">
<div class="flex justify-between items-start mb-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-200">
                                Relatórios
                            </span>
<span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold uppercase tracking-wide">
<span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                                Pausado
                            </span>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                            Relatório Mensal de Capitalização
                        </h3>
<p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            Geração de PDF com performance mensal dos títulos de capitalização.
                        </p>
<div class="flex items-center gap-3 mb-4">
<img alt="Owner" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDi3DZeRdWmVExGFZEcS4-asfNYD8Tj_TiqiS2cbK4wbmAET68YtQ9efxxgKewMNaBPmzLSBuZ8PKk5eWbNnJ-oBAwOT0MAMRsdR7cL6E9KAtndmNeGlI7QG8LfTbO6igDprH9TtI5VBYzdcPuUlIKr9S-RYbwrOBEEDjLmyHhEGrk03_0aeV7ea5AJb5LzMbR3v1gWflr6pSbohIJcvunRLH3SKuzVmAB5dR2gVUi9AV22F13LWgJ-hIKeRGmEzroJQXL_sDUxuWaM"/>
<span class="text-xs text-gray-500 dark:text-gray-400">Julia Pereira</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Última Execução</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    01/10/2023
                                </p>
</div>
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Status</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    Manual
                                </p>
</div>
</div>
</div>
<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
<button class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-brand-yellow transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">edit</span>
                            EDITAR
                        </button>
<button class="text-sm font-bold text-gray-400 cursor-not-allowed flex items-center gap-1">
<span class="material-icons-outlined text-base">play_arrow</span>
                            EXECUTAR
                        </button>
</div>
</div>
<div class="group bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col">
<div class="p-6 flex-1">
<div class="flex justify-between items-start mb-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-200">
                                Infraestrutura
                            </span>
<span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide">
<span class="w-2 h-2 rounded-full bg-green-500"></span>
                                Ativo
                            </span>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                            Backup de Bancos de Dados
                        </h3>
<p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            Rotina de backup incremental dos bancos de produção para o bucket S3 de contingência.
                        </p>
<div class="flex items-center gap-3 mb-4">
<img alt="Owner" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0xFbbUR6GDXdHAz4kXwQIHZyg5HCxBNaspu2Y1uwue_ZwwI1n2B1kIa57ZcCaPq4vu5RDmUx2D0CT74QLRt4ojyrMHd0wCre7dVRKl2Jmia0MgUQyHk4dA7Rhq_RGKR409yjmHE1q_pC3aus0uYzLyG5Sl0ai0q1qJLE9iUytWIAQLgcEzeBBl-txKpA-Za28XIPF2ev91RAVoo1CTjZRB_IvWwsIlCJ5BL-TEUrGeAIDKK2lO0PgHMj4dSJwtWzWLqENkeCpr4oW"/>
<span class="text-xs text-gray-500 dark:text-gray-400">System</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Última Execução</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">event_available</span>
                                    02:00 AM
                                </p>
</div>
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Próxima</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">update</span>
                                    02:00 AM
                                </p>
</div>
</div>
</div>
<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
<button class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-brand-yellow transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">edit</span>
                            EDITAR
                        </button>
<button class="text-sm font-bold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">play_arrow</span>
                            EXECUTAR AGORA
                        </button>
</div>
</div>
<div class="group bg-surface-light dark:bg-surface-dark rounded-lg border border-gray-200 dark:border-gray-700 shadow-card hover:shadow-lg transition-all duration-300 flex flex-col">
<div class="p-6 flex-1">
<div class="flex justify-between items-start mb-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-200">
                                Compliance
                            </span>
<span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide">
<span class="w-2 h-2 rounded-full bg-green-500"></span>
                                Ativo
                            </span>
</div>
<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors leading-tight">
                            Auditoria de Acessos
                        </h3>
<p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                            Verificação automática de logs de acesso e identificação de anomalias de segurança.
                        </p>
<div class="flex items-center gap-3 mb-4">
<img alt="Owner" class="w-6 h-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIH5BUad1ViuYjFC4CPUH6fAu8sklLOow5E4xHanvEO-M6UzbZ05lss8eM98hquKVb5bI0YuUX4y6Tb4YinpagSyXXBj8kl5V3xLZuXSVYPV_q-E54WhDfDiS1gcYIS9DQ3_JjYgARHAwSAKMJTBYw-Z_HCZ8N251TXwqlw9Shzzoe69RrdKNnCD5AIix-fXpfk0JYMKn653bDnM68lpvBkVnVOG8IQV_jrwIpt3BY5s2rFHCi4sCRWBxubJ_VMoD3xMHj3gPoCokH"/>
<span class="text-xs text-gray-500 dark:text-gray-400">Security Team</span>
</div>
<div class="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Última Execução</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">event_available</span>
                                    5 min atrás
                                </p>
</div>
<div>
<p class="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Próxima</p>
<p class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
<span class="material-icons-outlined text-sm text-gray-400">update</span>
                                    1 hora
                                </p>
</div>
</div>
</div>
<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
<button class="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-brand-yellow transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">edit</span>
                            EDITAR
                        </button>
<button class="text-sm font-bold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
<span class="material-icons-outlined text-base">play_arrow</span>
                            EXECUTAR AGORA
                        </button>
</div>
</div>
</div>
<div class="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
<p>© 2024   Capitalização S.A. - Plataforma de Automação Interna</p>
</div>
</main>
</div>

</body></html>

<!-- Fila de Execução -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Fila de Execução</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#005ea8", // Navy blue from the header
                        secondary: "#fce300", // Yellow accent
                        "background-light": "#f4f6f8",
                        "background-dark": "#1a202c",
                        "surface-light": "#ffffff",
                        "surface-dark": "#2d3748",
                        "text-light": "#333333",
                        "text-dark": "#e2e8f0",
                    },
                    fontFamily: {
                        sans: ['Roboto', 'sans-serif'],
                        display: ['Roboto', 'sans-serif'],
                    },
                    borderRadius: {
                        DEFAULT: "4px",
                    },
                },
            },
        };
    </script>
<style>::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
        }
        .dark ::-webkit-scrollbar-thumb {
            background: #4a5568;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans h-screen flex overflow-hidden">
<aside class="w-64 bg-primary text-white flex flex-col shadow-lg z-20">
<div class="h-16 flex items-center justify-center border-b border-blue-700">
<div class="flex items-center space-x-2">
<span class="bg-secondary text-primary font-bold px-1 rounded-sm text-sm"> </span>
<span class="font-bold text-lg tracking-wide">AUTOMATION</span>
</div>
</div>
<nav class="flex-1 overflow-y-auto py-4">
<ul class="space-y-1">
<li>
<a class="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700 hover:text-white transition-colors" href="#">
<span class="material-icons text-xl mr-3">dashboard</span>
<span class="text-sm font-medium">Dashboard</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700 hover:text-white transition-colors" href="#">
<span class="material-icons text-xl mr-3">play_circle_filled</span>
<span class="text-sm font-medium">Minhas Automações</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 bg-blue-800 text-white border-l-4 border-secondary transition-colors" href="#">
<span class="material-icons text-xl mr-3">queue</span>
<span class="text-sm font-medium">Fila de Execução</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700 hover:text-white transition-colors" href="#">
<span class="material-icons text-xl mr-3">history</span>
<span class="text-sm font-medium">Histórico</span>
</a>
</li>
<li>
<a class="flex items-center px-6 py-3 text-blue-100 hover:bg-blue-700 hover:text-white transition-colors" href="#">
<span class="material-icons text-xl mr-3">settings</span>
<span class="text-sm font-medium">Configurações</span>
</a>
</li>
</ul>
</nav>
<div class="p-4 border-t border-blue-700">
<div class="flex items-center space-x-3">
<img alt="User Avatar" class="w-8 h-8 rounded-full border border-secondary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJyVEur9Y3p-7BCnYUkvWjLjvlXMdmm5sM7DTY0L9_VtpnYMceqeHxiYm-vgM-Eu2J2lUMK48yuw14kng_eXxHaAfyp2oE3jB6_tDlF7_OSEemeDbAsg6f8USkAD4cG53gG1NOvGWFMimUnBq21lnVZ38mF3UO9w4jrRlG77qNeduwfHHzz3NQfJEQIUiP3lcJFBMBZS9ilERpTv6M4wF21yT09zEDb8qtqDkwYWjm56y5OdkI7Z6hYGBuopgQrVqICmGtZFbc3F-C"/>
<div class="flex-1 min-w-0">
<p class="text-sm font-medium truncate">Admin User</p>
<p class="text-xs text-blue-200 truncate">admin@ .com</p>
</div>
</div>
</div>
</aside>
<main class="flex-1 flex flex-col relative h-full">
<header class="h-16 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shadow-sm z-10">
<div class="flex items-center w-96">
<div class="relative w-full">
<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<span class="material-icons text-gray-400">search</span>
</span>
<input class="w-full py-2 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border-none rounded-md text-sm focus:ring-2 focus:ring-primary dark:text-gray-200" placeholder="Buscar execução..." type="text"/>
</div>
</div>
<div class="flex items-center space-x-4">
<button class="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors relative">
<span class="material-icons">notifications</span>
<span class="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full"></span>
</button>
<button class="p-2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors">
<span class="material-icons">help_outline</span>
</button>
<button class="hidden md:flex items-center space-x-2 text-sm font-medium text-primary hover:text-blue-700 transition-colors">
<span class="material-icons text-lg">add</span>
<span>Nova Execução</span>
</button>
</div>
</header>
<div class="flex-1 overflow-hidden relative flex">
<div class="flex-1 p-6 overflow-y-auto">
<div class="flex justify-between items-center mb-6">
<div>
<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Fila de Execução</h1>
<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie e monitore as automações em andamento.</p>
</div>
<div class="flex space-x-2">
<button class="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center">
<span class="material-icons text-base mr-1">filter_list</span> Filtrar
                        </button>
<button class="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center">
<span class="material-icons text-base mr-1">refresh</span> Atualizar
                        </button>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark rounded shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
<thead class="bg-gray-50 dark:bg-gray-800">
<tr>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">ID</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Automação</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Status</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Gatilho</th>
<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" scope="col">Responsável</th>
<th class="relative px-6 py-3" scope="col">
<span class="sr-only">Ações</span>
</th>
</tr>
</thead>
<tbody class="bg-white dark:bg-surface-dark divide-y divide-gray-200 dark:divide-gray-700">
<tr class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-primary hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">#EX-9281</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="text-sm font-medium text-gray-900 dark:text-white">Conciliação Financeira Diária</div>
<div class="text-xs text-gray-500 dark:text-gray-400">Finanças / Tesouraria</div>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                        Running
                                    </span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    16/01/2026 14:30
                                </td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="flex-shrink-0 h-6 w-6">
<img alt="" class="h-6 w-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbF8rraGGkKEhCZvwJ7zqdrmoG1jwELKWoyJQZ4Xr44wvZPa-c8DdHqoY4pfW4VApxiBpjgWMYgz2C3AFbqt18yW3IOClJlqBNd5mxSO5Go-CQXlu1yV_Zqvg4gSVb9oHi5shenK0naBnl2Y2znRFIf1z2sPyxSR25T5tWiX90Jv1kntN8FA54M_ka5_PLr-3Krdrh_WkvnEBdZoN-Yc9sqVq76AJA10iS_AcFt9X6_bjXs-rgrl7jXmINeG4xwx1SQQCeoJJrs2gJ"/>
</div>
<div class="ml-2 text-sm text-gray-500 dark:text-gray-400">João Silva</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
<span class="material-icons text-gray-400 hover:text-primary cursor-pointer">chevron_right</span>
</td>
</tr>
<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">#EX-9280</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="text-sm font-medium text-gray-900 dark:text-white">Emissão de Boletos Batch</div>
<div class="text-xs text-gray-500 dark:text-gray-400">Operações / Vendas</div>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                        Waiting
                                    </span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    16/01/2026 15:00
                                </td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="flex-shrink-0 h-6 w-6">
<img alt="" class="h-6 w-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHTzAFxqJxn6BlOqrx8FAe3qJ2j4gn4nviCb2CmZqjX1YUt9xG9ohAG4CBtfYgbM_efwGBotfZ826y8PQoKdiE7j452sTKq5P8-7Fa0EHiJhLN_9T29lKd5RQNjVJ76tg8nVWr-204FrN5yx2fGQ4YI2IEHroKu8uF6GPwQHvxuYWrJHpoo-REn176aPgw72dVP1z4Javu6VuGLJXcUe0rgr5kVuPzJmiDKZ_umS3ZO0k5oIJ1wSMKg_RRcjcVpXB2CuckHpNnot7d"/>
</div>
<div class="ml-2 text-sm text-gray-500 dark:text-gray-400">Maria Oliveira</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
<span class="material-icons text-gray-400 hover:text-primary cursor-pointer">chevron_right</span>
</td>
</tr>
<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">#EX-9279</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="text-sm font-medium text-gray-900 dark:text-white">Relatório de Sinistros</div>
<div class="text-xs text-gray-500 dark:text-gray-400">Seguros / Análise</div>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        Queued
                                    </span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    16/01/2026 15:15
                                </td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="text-sm text-gray-400 italic">Sistema</span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
<span class="material-icons text-gray-400 hover:text-primary cursor-pointer">chevron_right</span>
</td>
</tr>
<tr class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">#EX-9278</td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="text-sm font-medium text-gray-900 dark:text-white">Atualização Cadastral - CRM</div>
<div class="text-xs text-gray-500 dark:text-gray-400">Marketing / CRM</div>
</td>
<td class="px-6 py-4 whitespace-nowrap">
<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                                        Error
                                    </span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    16/01/2026 12:00
                                </td>
<td class="px-6 py-4 whitespace-nowrap">
<div class="flex items-center">
<div class="flex-shrink-0 h-6 w-6">
<img alt="" class="h-6 w-6 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1NpnrRMTRZlweMUX9ZU0BMLuajsWSClK1a4mGS-xR0Efl5QDjQS6VVKHpla4VvvKNEV0JWr1T5xo7wxXe-nk1WH3muUuKSgBFwt72T3e_gamI-_kktK-EDhrqMfXf2HU7d-zoCOZa9KD0Ejs0Kqa2E_fm6NajrnzX6bbNdq2Xyoo0smwfqtQqhs-bzBZek5voN1Pp3SmJBJPiVnwHpnKal20uSld3eSjRulvfHrPnKnajva5x-8ey3xucS2JT_ab3_-MztYnZaErO"/>
</div>
<div class="ml-2 text-sm text-gray-500 dark:text-gray-400">Pedro Santos</div>
</div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
<span class="material-icons text-gray-400 hover:text-primary cursor-pointer">chevron_right</span>
</td>
</tr>
</tbody>
</table>
<div class="bg-white dark:bg-surface-dark px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between sm:px-6">
<div class="flex-1 flex justify-between sm:hidden">
<a class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50" href="#"> Anterior </a>
<a class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50" href="#"> Próximo </a>
</div>
<div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
<div>
<p class="text-sm text-gray-700 dark:text-gray-400">
                                Mostrando <span class="font-medium">1</span> a <span class="font-medium">4</span> de <span class="font-medium">97</span> resultados
                              </p>
</div>
<div>
<nav aria-label="Pagination" class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
<a class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600" href="#">
<span class="sr-only">Anterior</span>
<span class="material-icons text-sm">chevron_left</span>
</a>
<a aria-current="page" class="z-10 bg-blue-50 dark:bg-blue-900 border-primary text-primary relative inline-flex items-center px-4 py-2 border text-sm font-medium" href="#"> 1 </a>
<a class="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium" href="#"> 2 </a>
<a class="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium" href="#"> 3 </a>
<a class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600" href="#">
<span class="sr-only">Próximo</span>
<span class="material-icons text-sm">chevron_right</span>
</a>
</nav>
</div>
</div>
</div>
</div>
</div>
<div class="w-96 bg-white dark:bg-surface-dark border-l border-gray-200 dark:border-gray-700 shadow-xl z-20 overflow-y-auto flex flex-col">
<div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-gray-50 dark:bg-gray-800">
<div>
<div class="flex items-center gap-2 mb-2">
<span class="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 uppercase tracking-wide">Running</span>
<span class="text-xs text-gray-500 dark:text-gray-400">#EX-9281</span>
</div>
<h2 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">Conciliação Financeira Diária</h2>
</div>
<button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
<span class="material-icons">close</span>
</button>
</div>
<div class="p-6 space-y-6 flex-1">
<div>
<div class="flex justify-between text-sm mb-1">
<span class="text-gray-600 dark:text-gray-400">Progresso</span>
<span class="font-medium text-primary">45%</span>
</div>
<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
<div class="bg-primary h-2.5 rounded-full" style="width: 45%"></div>
</div>
<p class="text-xs text-gray-500 mt-1">Estimativa de término: 5 min</p>
</div>
<div class="grid grid-cols-2 gap-4">
<div class="col-span-2">
<label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Iniciado por</label>
<div class="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
<img alt="" class="h-8 w-8 rounded-full mr-3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-PwxvbkRrDySVGhLLbtBDcCb-7qTRDYp_BdU-95U63thiddpd_pTMso2uIQNAUeOAkc6OqSN8NHr75Fgx2z4gv8vgWXejfmimQ1grbntuhOyvshOlyLMZ3ivY-mqI5v4NN8zITwMNoctqXdIhLvxh-rSIKQ6SXF7_F4HcToIUztxf4YUQMi9NkXzJUvwyq-1nDOYWmsDrZNLsBq4Cr8c7mE9tuEaGMBhQzRA78lKSzJGzgtlI4d0NCvuABAt4KyJ-PQtpX4TKB75l"/>
<div>
<p class="text-sm font-medium text-gray-900 dark:text-white">João Silva</p>
<p class="text-xs text-gray-500">joao.silva@ .com</p>
</div>
</div>
</div>
<div>
<label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Início</label>
<p class="text-sm font-medium text-gray-800 dark:text-gray-200">14:30:05</p>
</div>
<div>
<label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Duração</label>
<p class="text-sm font-medium text-gray-800 dark:text-gray-200">12m 30s</p>
</div>
</div>
<div class="border-t border-gray-100 dark:border-gray-700 pt-4">
<label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Parâmetros de Entrada</label>
<div class="bg-gray-50 dark:bg-gray-800 rounded p-3 font-mono text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 overflow-x-auto">
<pre>{
  "data_referencia": "2026-01-16",
  "bancos": ["ITA", "BRA", "SANT"],
  "tipo_conciliacao": "FULL",
  "notificar_erro": true
}</pre>
</div>
</div>
<div class="border-t border-gray-100 dark:border-gray-700 pt-4">
<label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Logs Recentes</label>
<ul class="space-y-3">
<li class="flex items-start text-xs">
<span class="text-gray-400 mr-2 min-w-[50px]">14:41:02</span>
<span class="text-gray-600 dark:text-gray-300">Processando arquivo RET_ITA_20260116.rem</span>
</li>
<li class="flex items-start text-xs">
<span class="text-gray-400 mr-2 min-w-[50px]">14:40:15</span>
<span class="text-gray-600 dark:text-gray-300">Conexão estabelecida com servidor FTP</span>
</li>
<li class="flex items-start text-xs">
<span class="text-gray-400 mr-2 min-w-[50px]">14:30:05</span>
<span class="text-green-600 font-medium">Processo iniciado com sucesso</span>
</li>
</ul>
</div>
</div>
<div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
<button class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
<span class="material-icons text-sm mr-2">cancel</span> Cancelar Execução
                    </button>
<button class="mt-2 w-full flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                        Ver Logs Completos
                    </button>
</div>
</div>
</div>
</main>
<div class="fixed inset-0 bg-black bg-opacity-50 z-10 hidden" id="mobile-overlay"></div>
<script>
        // Simple script to toggle details panel if needed in responsive view, 
        // though design is desktop first per instructions.
        // Also handling dark mode if system preference is set
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
             document.documentElement.classList.add('dark');
        }
    </script>

</body></html>

<!-- Histórico de Execuções -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Histórico de Execuções</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: "#005a9c", // Extracted deep blue from header/footer
              secondary: "#ffd100", // Extracted yellow accent
              "primary-hover": "#004880",
              "background-light": "#f4f6f8",
              "background-dark": "#1a202c",
              "surface-light": "#ffffff",
              "surface-dark": "#2d3748",
              "text-light": "#333333",
              "text-dark": "#e2e8f0",
              "status-success": "#28a745",
              "status-warning": "#ffc107",
              "status-error": "#dc3545",
            },
            fontFamily: {
              display: ["Roboto", "sans-serif"],
              body: ["Roboto", "sans-serif"],
            },
            borderRadius: {
              DEFAULT: "4px",
            },
          },
        },
      };
    </script>
<style>
        body {
            font-family: 'Roboto', sans-serif;
        }::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
        }
        .dark ::-webkit-scrollbar-thumb {
            background: #4a5568;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col min-h-screen">
<header class="bg-primary text-white shadow-md">
<div class="container mx-auto px-4 py-3 flex justify-between items-center">
<div class="flex items-center space-x-4">
<div class="text-2xl font-bold tracking-tight flex items-center">
<span class="bg-secondary text-primary px-2 py-1 mr-2 font-black rounded-sm text-sm uppercase"> </span>
<span>Automação</span>
</div>
<nav class="hidden md:flex space-x-6 text-sm font-medium ml-8">
<a class="opacity-80 hover:opacity-100 transition-opacity" href="#">Dashboard</a>
<a class="opacity-100 border-b-2 border-secondary pb-1" href="#">Histórico</a>
<a class="opacity-80 hover:opacity-100 transition-opacity" href="#">Configurações</a>
</nav>
</div>
<div class="flex items-center space-x-4">
<div class="relative hidden sm:block">
<input class="pl-9 pr-4 py-1.5 rounded bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:bg-white/20 focus:border-white/40 text-sm w-64" placeholder="Buscar execução..." type="text"/>
<span class="material-icons absolute left-2 top-1.5 text-white/60 text-lg">search</span>
</div>
<div class="flex items-center space-x-3">
<button class="p-1 hover:bg-white/10 rounded-full transition-colors">
<span class="material-icons text-xl">notifications</span>
</button>
<button class="p-1 hover:bg-white/10 rounded-full transition-colors">
<span class="material-icons text-xl">account_circle</span>
</button>
<button class="p-1 hover:bg-white/10 rounded-full transition-colors" onclick="document.documentElement.classList.toggle('dark')">
<span class="material-icons text-xl">dark_mode</span>
</button>
</div>
</div>
</div>
<div class="h-1 bg-gradient-to-r from-secondary to-yellow-500 w-full"></div>
</header>
<main class="flex-grow container mx-auto px-4 py-8">
<div class="mb-8">
<div class="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center">
<span class="material-icons text-sm mr-1">home</span> Início <span class="mx-2">/</span> Histórico de Execuções
            </div>
<h1 class="text-3xl font-bold text-primary dark:text-white mb-2">Histórico de Execuções</h1>
<p class="text-gray-600 dark:text-gray-300 max-w-3xl">
                Visualize e gerencie o registro completo de todas as automações executadas na plataforma. Utilize os filtros para refinar sua busca por data ou status.
            </p>
</div>
<div class="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
<div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
<div class="col-span-1">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Período</label>
<div class="relative">
<input class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white" type="date"/>
</div>
</div>
<div class="col-span-1">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</label>
<select class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white">
<option value="all">Todos os Status</option>
<option value="success">Sucesso</option>
<option value="warning">Aviso</option>
<option value="error">Erro</option>
<option value="running">Em Execução</option>
</select>
</div>
<div class="col-span-1">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Automação</label>
<input class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white" placeholder="Nome da automação" type="text"/>
</div>
<div class="col-span-1 flex space-x-2">
<button class="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded transition-colors text-sm flex justify-center items-center shadow-sm">
<span class="material-icons text-sm mr-2">filter_list</span> Filtrar
                    </button>
<button class="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-medium py-2 px-3 rounded transition-colors text-sm flex items-center" title="Exportar CSV">
<span class="material-icons text-lg">download</span>
</button>
</div>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
<th class="px-6 py-4">ID</th>
<th class="px-6 py-4 w-1/4">Automação</th>
<th class="px-6 py-4">Status</th>
<th class="px-6 py-4">Início</th>
<th class="px-6 py-4">Duração</th>
<th class="px-6 py-4">Gatilho</th>
<th class="px-6 py-4 text-right">Ações</th>
</tr>
</thead>
<tbody class="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
<tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
<td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">#45821</td>
<td class="px-6 py-4">
<div class="font-medium text-gray-900 dark:text-white">Conciliação Bancária Diária</div>
<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Finanças / Tesouraria</div>
</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
<span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                    Sucesso
                                </span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                                16/01/2026<br/>
<span class="text-xs text-gray-400">08:00 AM</span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">4m 12s</td>
<td class="px-6 py-4">
<div class="flex items-center text-gray-600 dark:text-gray-300">
<span class="material-icons text-base mr-1 text-gray-400">schedule</span>
                                    Agendado
                                </div>
</td>
<td class="px-6 py-4 text-right whitespace-nowrap">
<button class="text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 font-medium mr-3 text-xs uppercase tracking-wide">Detalhes</button>
<button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" title="Reexecutar">
<span class="material-icons text-xl align-middle">replay</span>
</button>
</td>
</tr>
<tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
<td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">#45820</td>
<td class="px-6 py-4">
<div class="font-medium text-gray-900 dark:text-white">Sincronização CRM - Salesforce</div>
<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vendas / CRM</div>
</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
<span class="material-icons text-[14px] mr-1">error_outline</span>
                                    Erro
                                </span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                                16/01/2026<br/>
<span class="text-xs text-gray-400">07:45 AM</span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">0m 45s</td>
<td class="px-6 py-4">
<div class="flex items-center text-gray-600 dark:text-gray-300">
<span class="material-icons text-base mr-1 text-gray-400">webhook</span>
                                    Webhook
                                </div>
</td>
<td class="px-6 py-4 text-right whitespace-nowrap">
<button class="text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 font-medium mr-3 text-xs uppercase tracking-wide">Detalhes</button>
<button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" title="Reexecutar">
<span class="material-icons text-xl align-middle">replay</span>
</button>
</td>
</tr>
<tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
<td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">#45819</td>
<td class="px-6 py-4">
<div class="font-medium text-gray-900 dark:text-white">Geração Relatório Mensal</div>
<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Operações / Relatórios</div>
</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
<span class="material-icons text-[14px] mr-1">warning_amber</span>
                                    Aviso
                                </span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                                15/01/2026<br/>
<span class="text-xs text-gray-400">18:30 PM</span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">12m 10s</td>
<td class="px-6 py-4">
<div class="flex items-center text-gray-600 dark:text-gray-300">
<span class="material-icons text-base mr-1 text-gray-400">person</span>
                                    Manual
                                </div>
</td>
<td class="px-6 py-4 text-right whitespace-nowrap">
<button class="text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 font-medium mr-3 text-xs uppercase tracking-wide">Detalhes</button>
<button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" title="Reexecutar">
<span class="material-icons text-xl align-middle">replay</span>
</button>
</td>
</tr>
<tr class="bg-blue-50/30 dark:bg-blue-900/5 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors group">
<td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">#45822</td>
<td class="px-6 py-4">
<div class="font-medium text-gray-900 dark:text-white">Processamento de Folha de Pagamento</div>
<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">RH / Pagamentos</div>
</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
<span class="material-icons text-[14px] mr-1 animate-spin text-[12px]">sync</span>
                                    Executando
                                </span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                                16/01/2026<br/>
<span class="text-xs text-gray-400">09:15 AM</span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">--</td>
<td class="px-6 py-4">
<div class="flex items-center text-gray-600 dark:text-gray-300">
<span class="material-icons text-base mr-1 text-gray-400">schedule</span>
                                    Agendado
                                </div>
</td>
<td class="px-6 py-4 text-right whitespace-nowrap">
<button class="text-gray-400 cursor-not-allowed font-medium mr-3 text-xs uppercase tracking-wide">Detalhes</button>
<button class="text-red-500 hover:text-red-700 transition-colors" title="Parar">
<span class="material-icons text-xl align-middle">stop_circle</span>
</button>
</td>
</tr>
<tr class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
<td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">#45818</td>
<td class="px-6 py-4">
<div class="font-medium text-gray-900 dark:text-white">Backup Noturno Banco de Dados</div>
<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">TI / Infraestrutura</div>
</td>
<td class="px-6 py-4">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
<span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                    Sucesso
                                </span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">
                                15/01/2026<br/>
<span class="text-xs text-gray-400">03:00 AM</span>
</td>
<td class="px-6 py-4 text-gray-600 dark:text-gray-300">45m 22s</td>
<td class="px-6 py-4">
<div class="flex items-center text-gray-600 dark:text-gray-300">
<span class="material-icons text-base mr-1 text-gray-400">schedule</span>
                                    Agendado
                                </div>
</td>
<td class="px-6 py-4 text-right whitespace-nowrap">
<button class="text-primary hover:text-primary-hover dark:text-blue-400 dark:hover:text-blue-300 font-medium mr-3 text-xs uppercase tracking-wide">Detalhes</button>
<button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" title="Reexecutar">
<span class="material-icons text-xl align-middle">replay</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
<div class="text-xs text-gray-500 dark:text-gray-400">
                    Mostrando <span class="font-medium text-gray-700 dark:text-gray-200">1</span> a <span class="font-medium text-gray-700 dark:text-gray-200">5</span> de <span class="font-medium text-gray-700 dark:text-gray-200">148</span> resultados
                </div>
<div class="flex space-x-1">
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50" disabled="">
<span class="material-icons text-sm align-middle">chevron_left</span>
</button>
<button class="px-3 py-1 border border-primary bg-primary text-white rounded-md text-sm font-medium">1</button>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">2</button>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">3</button>
<span class="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">12</button>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
<span class="material-icons text-sm align-middle">chevron_right</span>
</button>
</div>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
<div class="bg-surface-light dark:bg-surface-dark p-5 rounded-lg border-l-4 border-green-500 shadow-sm flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Taxa de Sucesso (Hoje)</p>
<p class="text-2xl font-bold text-gray-800 dark:text-white mt-1">98.5%</p>
</div>
<div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
<span class="material-icons text-green-500">check_circle</span>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark p-5 rounded-lg border-l-4 border-primary shadow-sm flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Total Execuções (Mês)</p>
<p class="text-2xl font-bold text-gray-800 dark:text-white mt-1">1,240</p>
</div>
<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
<span class="material-icons text-primary">analytics</span>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark p-5 rounded-lg border-l-4 border-secondary shadow-sm flex items-center justify-between">
<div>
<p class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">Tempo Médio</p>
<p class="text-2xl font-bold text-gray-800 dark:text-white mt-1">3m 12s</p>
</div>
<div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
<span class="material-icons text-yellow-600 dark:text-yellow-500">timer</span>
</div>
</div>
</div>
</main>
<footer class="bg-primary text-white py-12 border-t-4 border-secondary mt-auto">
<div class="container mx-auto px-4">
<div class="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
<div class="mb-6 md:mb-0">
<div class="text-2xl font-bold tracking-tight flex justify-center md:justify-start items-center mb-2">
<span class="bg-secondary text-primary px-2 py-1 mr-2 font-black rounded-sm text-sm uppercase"> </span>
<span>Automação</span>
</div>
<p class="text-blue-100 text-sm max-w-sm">Plataforma interna de orquestração e monitoramento de processos automatizados.</p>
</div>
<div class="flex space-x-6">
<a class="text-white hover:text-secondary transition-colors" href="#"><span class="material-icons">help_outline</span></a>
<a class="text-white hover:text-secondary transition-colors" href="#"><span class="material-icons">settings</span></a>
<a class="text-white hover:text-secondary transition-colors" href="#"><span class="material-icons">security</span></a>
</div>
</div>
<div class="mt-8 pt-8 border-t border-blue-800 flex flex-col md:flex-row justify-between items-center text-xs text-blue-200">
<p>© 2026  . Todos os direitos reservados.</p>
<div class="mt-2 md:mt-0 flex space-x-4">
<a class="hover:text-white" href="#">Termos de Uso</a>
<a class="hover:text-white" href="#">Privacidade</a>
</div>
</div>
</div>
</footer>

</body></html>

<!-- Logs do Sistema -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Logs do Sistema - Automação Interna</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#005695",
                        secondary: "#FFD700",
                        "primary-dark": "#004070",
                        "accent-blue": "#007BFF",
                        "background-light": "#F3F4F6",
                        "background-dark": "#111827",
                        "surface-light": "#FFFFFF",
                        "surface-dark": "#1F2937",
                        "text-light": "#333333",
                        "text-dark": "#E5E7EB",
                        "border-light": "#E5E7EB",
                        "border-dark": "#374151",
                        "status-info": "#0ea5e9", // Sky 500
                        "status-warn": "#f59e0b", // Amber 500
                        "status-error": "#ef4444", // Red 500
                    },
                    fontFamily: {
                        display: ["Roboto", "sans-serif"],
                        body: ["Roboto", "sans-serif"],
                        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
                    },
                    borderRadius: {
                        DEFAULT: "4px",
                    },
                },
            },
        };
    </script>
<style>.log-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .log-container::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
        }
        .log-container::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .dark .log-container::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }
        .dark .log-container::-webkit-scrollbar-thumb {
            background: #4b5563;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark font-body text-text-light dark:text-text-dark min-h-screen flex flex-col transition-colors duration-200">
<header class="bg-primary text-white shadow-md z-20 relative">
<div class="container mx-auto px-4 py-3 flex items-center justify-between">
<div class="flex items-center gap-4">
<div class="font-bold text-2xl tracking-tight flex items-center gap-2">
<span class="material-icons-outlined">dns</span>
<span>  <span class="font-light opacity-80 text-sm align-middle ml-1">Automação</span></span>
</div>
</div>
<div class="flex-1 max-w-xl mx-8 hidden md:block">
<div class="relative">
<span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
<input class="w-full pl-10 pr-4 py-2 rounded bg-white text-gray-800 border-none focus:ring-2 focus:ring-secondary text-sm placeholder-gray-500" placeholder="Pesquisar logs por ID, mensagem ou erro..." type="text"/>
</div>
</div>
<div class="flex items-center gap-4">
<button class="p-2 hover:bg-primary-dark rounded-full transition-colors relative">
<span class="material-icons-outlined">notifications</span>
<span class="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full"></span>
</button>
<div class="flex items-center gap-2 cursor-pointer hover:bg-primary-dark p-2 rounded transition-colors">
<div class="w-8 h-8 rounded-full bg-secondary text-primary font-bold flex items-center justify-center">AD</div>
<span class="hidden sm:inline text-sm font-medium">Admin</span>
</div>
</div>
</div>
<div class="bg-primary-dark border-t border-primary border-opacity-30">
<div class="container mx-auto px-4">
<nav class="flex space-x-6 text-sm overflow-x-auto">
<a class="py-3 px-2 text-white opacity-70 hover:opacity-100 hover:border-b-2 hover:border-secondary transition-all" href="#">Dashboard</a>
<a class="py-3 px-2 text-white font-bold border-b-2 border-secondary" href="#">Logs do Sistema</a>
<a class="py-3 px-2 text-white opacity-70 hover:opacity-100 hover:border-b-2 hover:border-secondary transition-all" href="#">Monitoramento</a>
<a class="py-3 px-2 text-white opacity-70 hover:opacity-100 hover:border-b-2 hover:border-secondary transition-all" href="#">Configurações</a>
</nav>
</div>
</div>
</header>
<main class="flex-grow container mx-auto px-4 py-8">
<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
<div>
<h1 class="text-3xl font-bold text-primary dark:text-blue-400 mb-1">Logs do Sistema</h1>
<p class="text-sm text-gray-600 dark:text-gray-400">Histórico de eventos e diagnósticos da plataforma de automação.</p>
</div>
<div class="flex gap-2">
<button class="flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
<span class="material-icons-outlined text-base">download</span> Exportar CSV
                </button>
<button class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors text-sm font-medium shadow-sm">
<span class="material-icons-outlined text-base">refresh</span> Atualizar
                </button>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark p-5 rounded shadow-sm border border-border-light dark:border-border-dark mb-6">
<div class="flex flex-col lg:flex-row gap-4 items-end">
<div class="w-full lg:w-1/4">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nível de Log</label>
<select class="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
<option>Todos os Níveis</option>
<option>INFO</option>
<option>AVISO</option>
<option>ERRO</option>
</select>
</div>
<div class="w-full lg:w-1/4">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Componente</label>
<select class="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
<option>Todos os Componentes</option>
<option>Autenticação API</option>
<option>Processador de Pagamentos</option>
<option>Crawler Externo</option>
<option>Database Sync</option>
</select>
</div>
<div class="w-full lg:w-1/3">
<label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Período</label>
<div class="flex gap-2">
<input class="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50" type="datetime-local"/>
<span class="self-center text-gray-400">-</span>
<input class="w-full rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50" type="datetime-local"/>
</div>
</div>
<div class="w-full lg:w-auto">
<button class="w-full bg-secondary text-primary font-bold px-6 py-2 rounded hover:bg-yellow-400 transition-colors shadow-sm">
                        Filtrar
                    </button>
</div>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark rounded shadow-md border border-border-light dark:border-border-dark overflow-hidden flex flex-col h-[600px]">
<div class="grid grid-cols-12 bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark py-3 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
<div class="col-span-2">Timestamp</div>
<div class="col-span-1 text-center">Nível</div>
<div class="col-span-2">Componente</div>
<div class="col-span-6">Mensagem</div>
<div class="col-span-1 text-right">Ações</div>
</div>
<div class="log-container overflow-y-auto flex-grow">
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:32:05
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800">
                            ERRO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Processador de Pagamentos
                    </div>
<div class="col-span-6 text-sm text-primary dark:text-blue-300 font-bold">
                        Falha na conexão com gateway de pagamento: Timeout após 3000ms.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:31:58
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            AVISO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Database Sync
                    </div>
<div class="col-span-6 text-sm text-gray-800 dark:text-gray-200">
                        Latência alta detectada na réplica de leitura (250ms).
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:31:45
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            INFO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Autenticação API
                    </div>
<div class="col-span-6 text-sm text-gray-600 dark:text-gray-400">
                        Usuário 'admin_sys' autenticado com sucesso via Token JWT.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:30:12
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            INFO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Crawler Externo
                    </div>
<div class="col-span-6 text-sm text-gray-600 dark:text-gray-400">
                        Job #4829 iniciado: Coleta de dados financeiros diários.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:28:33
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800">
                            ERRO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Crawler Externo
                    </div>
<div class="col-span-6 text-sm text-primary dark:text-blue-300 font-bold">
                        Exceção não tratada: NullReferenceException no módulo de parse.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:25:10
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            INFO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        System Health
                    </div>
<div class="col-span-6 text-sm text-gray-600 dark:text-gray-400">
                        Verificação de integridade concluída: Todos os serviços operacionais.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:22:15
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            AVISO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        File Storage
                    </div>
<div class="col-span-6 text-sm text-gray-800 dark:text-gray-200">
                        O disco /mnt/data atingiu 85% de capacidade.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:15:00
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            INFO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Autenticação API
                    </div>
<div class="col-span-6 text-sm text-gray-600 dark:text-gray-400">
                        Token de acesso renovado para serviço 'pagamentos-service'.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
<div class="grid grid-cols-12 items-center py-3 px-4 border-b border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
<div class="col-span-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        2023-10-24 14:10:22
                    </div>
<div class="col-span-1 text-center">
<span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-800">
                            ERRO
                        </span>
</div>
<div class="col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notification Service
                    </div>
<div class="col-span-6 text-sm text-primary dark:text-blue-300 font-bold">
                        Falha ao enviar e-mail via SMTP: Relay access denied.
                    </div>
<div class="col-span-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
<button class="text-gray-400 hover:text-primary dark:hover:text-white" title="Ver detalhes">
<span class="material-icons-outlined text-lg">visibility</span>
</button>
</div>
</div>
</div>
<div class="bg-gray-50 dark:bg-gray-800 border-t border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between">
<div class="text-xs text-gray-500 dark:text-gray-400">
                    Mostrando <span class="font-bold">1-50</span> de <span class="font-bold">2,492</span> logs
                </div>
<div class="flex gap-2">
<button class="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50">Anterior</button>
<button class="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Próximo</button>
</div>
</div>
</div>
</main>
<footer class="bg-primary text-white py-8 mt-auto">
<div class="container mx-auto px-4">
<div class="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white border-opacity-20 pb-6 mb-4">
<div class="bg-secondary text-primary font-extrabold px-3 py-1 inline-block uppercase text-lg tracking-wider">
                     
                </div>
<div class="text-lg font-bold">
                    Plataforma de Automação
                </div>
</div>
<div class="flex flex-col md:flex-row justify-between items-center text-xs opacity-70">
<div class="flex gap-6 mb-4 md:mb-0">
<a class="flex items-center gap-1 hover:text-secondary" href="#"><span class="material-icons-outlined text-sm">support</span> Suporte Técnico</a>
<a class="flex items-center gap-1 hover:text-secondary" href="#"><span class="material-icons-outlined text-sm">menu_book</span> Documentação</a>
</div>
<div class="text-center md:text-right">
<p>Desenvolvido por Equipe Interna de TI © 2023</p>
</div>
</div>
</div>
</footer>
<div class="fixed bottom-6 right-6 z-50">
<button class="bg-surface-light dark:bg-surface-dark text-primary p-3 rounded-full shadow-lg border border-border-light dark:border-border-dark hover:scale-105 transition-transform" onclick="document.documentElement.classList.toggle('dark')">
<span class="material-icons-outlined block dark:hidden">dark_mode</span>
<span class="material-icons-outlined hidden dark:block">light_mode</span>
</button>
</div>

</body></html>

<!-- Modal: Criar Automação -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Plataforma de Automação - Criar Nova Automação</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: "#005CAB", //   Blue
              secondary: "#FFD700", //   Yellow/Gold
              "background-light": "#F4F6F8",
              "background-dark": "#1A202C",
              "surface-light": "#FFFFFF",
              "surface-dark": "#2D3748",
              "text-light": "#333333",
              "text-dark": "#E2E8F0",
              "border-light": "#E2E8F0",
              "border-dark": "#4A5568",
            },
            fontFamily: {
              display: ["Roboto", "sans-serif"],
              sans: ["Roboto", "sans-serif"],
            },
            borderRadius: {
              DEFAULT: "0.25rem",
              'lg': "0.5rem",
              'xl': "0.75rem",
            },
          },
        },
      };
    </script>
</head>
<body class="bg-background-light dark:bg-background-dark font-sans text-text-light dark:text-text-dark antialiased transition-colors duration-200">
<nav class="bg-primary text-white shadow-lg relative z-10">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="flex justify-between h-16">
<div class="flex items-center">
<div class="flex-shrink-0 flex items-center space-x-2">
<div class="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center">
<span class="text-primary font-bold text-lg">B</span>
</div>
<span class="font-bold text-xl tracking-tight">  Automate</span>
</div>
<div class="hidden sm:ml-8 sm:flex sm:space-x-8">
<a class="border-b-2 border-secondary text-white inline-flex items-center px-1 pt-1 text-sm font-medium" href="#">
                            Automações
                        </a>
<a class="border-transparent text-gray-200 hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors" href="#">
                            Relatórios
                        </a>
<a class="border-transparent text-gray-200 hover:text-white hover:border-gray-300 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors" href="#">
                            Configurações
                        </a>
</div>
</div>
<div class="flex items-center space-x-4">
<button class="text-gray-200 hover:text-white transition-colors">
<span class="material-icons">notifications</span>
</button>
<div class="h-8 w-8 rounded-full bg-gray-300 overflow-hidden border-2 border-white">
<img alt="User Avatar" class="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvwJSokx6eqDSWo8KsR0lG1apFcUXOl6Y_BpljTNjQo8JhEV_K6wyRm0EvceD0sQbVmsoHojkNEKKlsUjEalP2VOeLpQqbTnOyHz5iz7Ox1M8w-jIrRMwe5PkH4WgBTxu2fCYhjNJpt65CNT8k6Cl87U55lf9l687nTwahO965_p8AnwNQWVTR3PDtycCYmrVd8Up_bz6PUlCP2U6xt5BY60ppWfOHNumsgbJ2l9bv4OABduagIhfXVTp3aQ5Au2FnwBmvsdbUDhC8"/>
</div>
</div>
</div>
</div>
</nav>
<div aria-hidden="true" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 filter blur-[2px] opacity-50 pointer-events-none select-none">
<div class="md:flex md:items-center md:justify-between mb-8">
<div class="flex-1 min-w-0">
<h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                    Minhas Automações
                </h2>
<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Gerencie seus fluxos de trabalho e integrações.</p>
</div>
<div class="mt-4 flex md:mt-0 md:ml-4">
<button class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" type="button">
<span class="material-icons text-sm mr-2">add</span>
                    Nova Automação
                </button>
</div>
</div>
<div class="bg-surface-light dark:bg-surface-dark shadow overflow-hidden sm:rounded-lg border border-border-light dark:border-border-dark">
<ul class="divide-y divide-border-light dark:divide-border-dark" role="list">
<li>
<div class="block hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
<div class="px-4 py-4 sm:px-6">
<div class="flex items-center justify-between">
<p class="text-sm font-medium text-primary truncate">Boas-vindas Novos Clientes</p>
<div class="ml-2 flex-shrink-0 flex">
<p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Ativo
                                    </p>
</div>
</div>
<div class="mt-2 sm:flex sm:justify-between">
<div class="sm:flex">
<p class="flex items-center text-sm text-gray-500 dark:text-gray-400">
<span class="material-icons text-gray-400 text-sm mr-1">email</span>
                                        Email Marketing
                                    </p>
</div>
</div>
</div>
</div>
</li>
<li>
<div class="block hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
<div class="px-4 py-4 sm:px-6">
<div class="flex items-center justify-between">
<p class="text-sm font-medium text-primary truncate">Relatório Mensal de Vendas</p>
<div class="ml-2 flex-shrink-0 flex">
<p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        Pausado
                                    </p>
</div>
</div>
<div class="mt-2 sm:flex sm:justify-between">
<div class="sm:flex">
<p class="flex items-center text-sm text-gray-500 dark:text-gray-400">
<span class="material-icons text-gray-400 text-sm mr-1">schedule</span>
                                        Agendado
                                    </p>
</div>
</div>
</div>
</div>
</li>
</ul>
</div>
</div>
<div aria-labelledby="modal-title" aria-modal="true" class="fixed inset-0 z-20 overflow-y-auto" role="dialog">
<div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
<div aria-hidden="true" class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"></div>
<span aria-hidden="true" class="hidden sm:inline-block sm:align-middle sm:h-screen">​</span>
<div class="inline-block align-bottom bg-surface-light dark:bg-surface-dark rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border-t-4 border-secondary">
<div class="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:px-6 border-b border-border-light dark:border-border-dark">
<div class="flex justify-between items-center mb-6">
<h3 class="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                            Criar Nova Automação
                        </h3>
<button class="bg-transparent rounded-md text-gray-400 hover:text-gray-500 focus:outline-none" type="button">
<span class="sr-only">Fechar</span>
<span class="material-icons">close</span>
</button>
</div>
<nav aria-label="Progress">
<ol class="flex items-center" role="list">
<li class="relative pr-8 sm:pr-20">
<div aria-hidden="true" class="absolute inset-0 flex items-center">
<div class="h-0.5 w-full bg-gray-200 dark:bg-gray-600"></div>
</div>
<a class="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary hover:bg-blue-700 ring-4 ring-white dark:ring-surface-dark" href="#">
<span class="material-icons text-white text-sm">edit</span>
</a>
<span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-primary dark:text-blue-400">Dados</span>
</li>
<li class="relative px-8 sm:px-20">
<div aria-hidden="true" class="absolute inset-0 flex items-center">
<div class="h-0.5 w-full bg-gray-200 dark:bg-gray-600"></div>
</div>
<a class="relative flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400" href="#">
<span class="material-icons text-gray-500 dark:text-gray-400 text-sm">bolt</span>
</a>
<span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500 dark:text-gray-400">Gatilho</span>
</li>
<li class="relative px-8 sm:px-20">
<div aria-hidden="true" class="absolute inset-0 flex items-center">
<div class="h-0.5 w-full bg-gray-200 dark:bg-gray-600"></div>
</div>
<a class="relative flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400" href="#">
<span class="material-icons text-gray-500 dark:text-gray-400 text-sm">play_arrow</span>
</a>
<span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500 dark:text-gray-400">Ações</span>
</li>
<li class="relative pl-8 sm:pl-20">
<div aria-hidden="true" class="absolute inset-0 flex items-center">
</div>
<a class="relative flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400" href="#">
<span class="material-icons text-gray-500 dark:text-gray-400 text-sm">check</span>
</a>
<span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500 dark:text-gray-400">Revisão</span>
</li>
</ol>
</nav>
</div>
<div class="px-4 py-8 sm:p-8">
<div class="space-y-6">
<div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary p-4 mb-6 rounded-r-md">
<div class="flex">
<div class="flex-shrink-0">
<span class="material-icons text-primary dark:text-blue-400">info</span>
</div>
<div class="ml-3">
<p class="text-sm text-blue-700 dark:text-blue-200">
                                        Defina o nome e os detalhes básicos para identificar esta automação no painel.
                                    </p>
</div>
</div>
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="name">
                                Nome da Automação <span class="text-red-500">*</span>
</label>
<div class="mt-1 relative rounded-md shadow-sm">
<input class="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md h-10 px-3" id="name" name="name" placeholder="Ex: Lead Scoring - Q1" type="text"/>
</div>
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="description">
                                Descrição
                            </label>
<div class="mt-1">
<textarea class="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-3" id="description" name="description" placeholder="Descreva o objetivo desta automação..." rows="3"></textarea>
</div>
<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Breve explicação sobre o que este fluxo faz.</p>
</div>
<div>
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300" for="tags">
                                Tags
                            </label>
<div class="mt-1 relative rounded-md shadow-sm">
<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<span class="material-icons text-gray-400 text-sm">label</span>
</div>
<input class="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md h-10" id="tags" name="tags" placeholder="Ex: marketing, vendas, onboarding" type="text"/>
</div>
<div class="mt-2 flex flex-wrap gap-2">
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    + Marketing
                                </span>
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    + Operações
                                </span>
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    + Financeiro
                                </span>
</div>
</div>
</div>
</div>
<div class="bg-gray-50 dark:bg-gray-800 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border-light dark:border-border-dark">
<button class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-primary text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm uppercase tracking-wide transition-colors" type="button">
                        Próximo
                    </button>
<button class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-6 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm uppercase tracking-wide transition-colors" type="button">
                        Cancelar
                    </button>
</div>
</div>
</div>
</div>

</body></html>

<!-- Listagem de Cenários -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Listagem de Cenários - Automation Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                         : {
                            navy: "#005696",
                            yellow: "#FFC107",
                            bg: "#F5F7FA",
                            surface: "#FFFFFF",
                            text: "#1E293B",
                            border: "#E0E0E0",
                        },
                    },
                    fontFamily: {
                        sans: ["Inter", "sans-serif"],
                    },
                    boxShadow: {
                        'subtle': '0 2px 4px rgba(0,0,0,0.05)',
                        'card': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                    },
                    borderRadius: {
                        'card': '8px',
                    }
                },
            },
        };
    </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #F5F7FA;
        }
        .btn-primary {
            background-color: #FFC107;
            color: #005696;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .btn-primary:hover {
            background-color: #FFCA28;
        }
        .nav-link {
            color: rgba(255, 255, 255, 0.9);
            transition: all 0.2s;
            position: relative;
        }
        .nav-link:hover {
            color: #ffffff;
            opacity: 1;
        }
        .nav-link.active {
            font-weight: 600;
            color: #ffffff;
        }
        .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background-color: #FFC107;
            border-top-left-radius: 2px;
            border-top-right-radius: 2px;
        }
        .pill-nav-active {
            background-color: #005696;
            color: white;
            border: 1px solid #005696;
        }
        .pill-nav-inactive {
            background-color: white;
            color: #64748B;
            border: 1px solid #E0E0E0;
        }
        .pill-nav-inactive:hover {
            background-color: #F8FAFC;
            border-color: #CBD5E1;
            color: #005696;
        }.scenario-card {
            background-color: #FFFFFF;
            border-radius: 8px;
            border: 1px solid #E0E0E0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: box-shadow 0.2s ease-in-out;
        }
        .scenario-card:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 4px;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col text-slate-800 bg-[#F5F7FA]">
<header class="bg-[#005696] text-white shadow-md sticky top-0 z-50">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="flex flex-col">
<span class="text-[10px] tracking-widest text-blue-100/80 uppercase font-semibold mb-0.5">Automation Dashboard</span>
<h1 class="text-xl font-bold tracking-tight leading-none">Listagem de Cenários</h1>
</div>
</div>
<nav class="hidden md:flex items-stretch gap-8 text-sm font-medium h-full">
<a class="nav-link active flex items-center px-1" href="#">Planos</a>
<a class="nav-link flex items-center px-1" href="#">Exemplos</a>
<a class="nav-link flex items-center px-1" href="#">Execuções</a>
<a class="nav-link flex items-center px-1" href="#">Runs</a>
<a class="nav-link flex items-center px-1" href="#">Relatórios</a>
<a class="nav-link flex items-center px-1" href="#">Gatilhos</a>
</nav>
</div>
</header>
<div class="bg-white border-b border-[#E0E0E0] py-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div class="flex flex-wrap gap-2 mb-8">
<button class="pill-nav-active px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm transition-colors">Planos</button>
<button class="pill-nav-inactive px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">Exemplos</button>
<button class="pill-nav-inactive px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">Execuções</button>
<button class="pill-nav-inactive px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">Runs</button>
<button class="pill-nav-inactive px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">Relatórios</button>
<button class="pill-nav-inactive px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">Gatilhos</button>
</div>
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h2 class="text-2xl font-bold text-[#005696] mb-1">Cenários</h2>
<p class="text-sm text-slate-500">Fluxos reais de produção e automação.</p>
</div>
<div>
<button class="flex items-center gap-2 bg-[#005696] hover:bg-[#00447a] text-white px-4 py-2 rounded text-xs font-bold uppercase shadow transition-colors">
<span class="material-symbols-outlined text-sm">refresh</span>
<span>Atualizar</span>
</button>
</div>
</div>
<div class="mt-6 flex flex-wrap gap-3">
<div class="relative flex-grow max-w-md">
<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-slate-400">search</span>
</span>
<input class="block w-full pl-10 pr-3 py-2 border border-[#E0E0E0] rounded-lg leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#005696] focus:border-[#005696] sm:text-sm shadow-inner transition-colors" placeholder="Filtrar cenários por nome, env, ticket, caminho..." type="text"/>
</div>
<button class="bg-white border border-[#E0E0E0] text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-[#005696] transition-colors shadow-sm">
                    Limpar
                </button>
</div>
</div>
</div>
<main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
<div class="scenario-card flex flex-col overflow-hidden">
<div class="p-6 pb-2">
<div class="flex flex-wrap items-center gap-3 mb-2">
<h3 class="text-lg font-bold text-[#005696]">full-flow</h3>
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">3 Steps</span>
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">Scenario</span>
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">Reuse Session</span>
</div>
<p class="text-xs text-slate-400 font-mono mb-4 truncate">scenarios/full-flow/plan.json</p>
<div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
<div class="flex items-center gap-2">
<label class="inline-flex items-center cursor-pointer select-none group">
<input checked="" class="form-checkbox h-4 w-4 text-[#005696] rounded border-slate-300 focus:ring-[#005696] group-hover:border-[#005696] transition-colors" type="checkbox"/>
<span class="ml-2 text-sm text-slate-700 font-medium group-hover:text-[#005696] transition-colors">Selecionar tudo</span>
</label>
<span class="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">3/3</span>
</div>
</div>
<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 mb-5">
<div class="bg-slate-50 p-2 rounded border border-slate-100 hover:border-[#E0E0E0] transition-colors">
<strong class="block text-[#005696] text-[10px] uppercase mb-0.5 font-bold">Ticket</strong>
<span class="font-medium">FLOW-001</span>
</div>
<div class="bg-slate-50 p-2 rounded border border-slate-100 hover:border-[#E0E0E0] transition-colors">
<strong class="block text-[#005696] text-[10px] uppercase mb-0.5 font-bold">Environment</strong>
<span class="font-medium">local</span>
</div>
<div class="bg-slate-50 p-2 rounded border border-slate-100 sm:col-span-1 hover:border-[#E0E0E0] transition-colors">
<strong class="block text-[#005696] text-[10px] uppercase mb-0.5 font-bold">Types</strong>
<span class="font-medium">api (1), sqlEvidence (1), browser (1)</span>
</div>
</div>
<div class="bg-[#F8FAFC] rounded border border-[#E0E0E0] p-4 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
<div class="absolute top-0 left-0 w-1 h-full bg-[#005696] rounded-l"></div>
<div class="space-y-3">
<h4 class="text-xs font-bold text-[#005696] uppercase tracking-wider border-b border-slate-200 pb-1">Execution</h4>
<div>
<div class="text-sm font-semibold text-slate-800">Fail policy: <span class="text-red-600">stop</span></div>
<div class="text-xs text-slate-500">Cache: disabled</div>
</div>
<div>
<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Browser</div>
<div class="text-sm font-semibold text-slate-800">reuse, headless</div>
<div class="text-xs text-slate-500">Reuse: yes • Channel: default</div>
</div>
</div>
<div class="space-y-3">
<h4 class="text-xs font-bold text-[#005696] uppercase tracking-wider border-b border-slate-200 pb-1">Inputs</h4>
<div>
<div class="text-sm font-semibold text-slate-800">Env prefix: none</div>
<div class="text-xs text-slate-500">Defaults: 0 • Overrides: 0 • Items: 2</div>
</div>
<div>
<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assets</div>
<div class="text-sm font-semibold text-slate-800 leading-tight">behaviors.json, request.curl</div>
</div>
</div>
</div>
</div>
<div class="p-6 pt-4 mt-auto border-t border-[#E0E0E0] bg-slate-50/50">
<div class="flex flex-wrap items-end gap-3 w-full">
<div class="flex items-center gap-2 bg-white p-1 rounded border border-[#E0E0E0] shadow-sm mr-auto">
<span class="text-xs font-medium text-slate-500 pl-2 uppercase tracking-wide">Passos:</span>
<input class="w-12 px-1 py-1 text-sm border border-slate-300 rounded text-center focus:ring-[#005696] focus:border-[#005696] font-mono" type="number" value="1"/>
<span class="text-xs text-slate-400">-</span>
<input class="w-12 px-1 py-1 text-sm border border-slate-300 rounded text-center focus:ring-[#005696] focus:border-[#005696] font-mono" type="number" value="3"/>
<button class="ml-1 px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors uppercase tracking-wide border border-transparent hover:border-slate-300">
                                Run Range
                            </button>
</div>
<button class="px-5 py-2 rounded text-[#005696] text-xs font-bold uppercase border border-[#005696] hover:bg-blue-50 transition-colors tracking-wide">
                            Ver plano
                        </button>
<button class="btn-primary px-5 py-2 rounded shadow-sm text-xs transition-colors tracking-wide">
                            Rodar Selecionados
                        </button>
</div>
</div>
</div>
<div class="scenario-card flex flex-col overflow-hidden">
<div class="p-6 pb-2">
<div class="flex flex-wrap items-center gap-3 mb-2">
<h3 class="text-lg font-bold text-[#005696]">inputs-exports</h3>
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">3 Steps</span>
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">Scenario</span>
<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">ENV AUTO_</span>
</div>
<p class="text-xs text-slate-400 font-mono mb-4 truncate">scenarios/inputs-exports/plan.json</p>
<div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
<div class="flex items-center gap-2">
<label class="inline-flex items-center cursor-pointer select-none group">
<input checked="" class="form-checkbox h-4 w-4 text-[#005696] rounded border-slate-300 focus:ring-[#005696] group-hover:border-[#005696] transition-colors" type="checkbox"/>
<span class="ml-2 text-sm text-slate-700 font-medium group-hover:text-[#005696] transition-colors">Selecionar tudo</span>
</label>
<span class="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">3/3</span>
</div>
</div>
<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 mb-5">
<div class="bg-slate-50 p-2 rounded border border-slate-100 hover:border-[#E0E0E0] transition-colors">
<strong class="block text-[#005696] text-[10px] uppercase mb-0.5 font-bold">Ticket</strong>
<span class="font-medium">CTX-001</span>
</div>
<div class="bg-slate-50 p-2 rounded border border-slate-100 hover:border-[#E0E0E0] transition-colors">
<strong class="block text-[#005696] text-[10px] uppercase mb-0.5 font-bold">Environment</strong>
<span class="font-medium">local</span>
</div>
<div class="bg-slate-50 p-2 rounded border border-slate-100 sm:col-span-1 hover:border-[#E0E0E0] transition-colors">
<strong class="block text-[#005696] text-[10px] uppercase mb-0.5 font-bold">Types</strong>
<span class="font-medium">cli (1), specialist (1), browser (1)</span>
</div>
</div>
<div class="bg-[#F8FAFC] rounded border border-[#E0E0E0] p-4 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
<div class="absolute top-0 left-0 w-1 h-full bg-[#005696] rounded-l"></div>
<div class="space-y-3">
<h4 class="text-xs font-bold text-[#005696] uppercase tracking-wider border-b border-slate-200 pb-1">Execution</h4>
<div>
<div class="text-sm font-semibold text-slate-800">Fail policy: <span class="text-red-600">stop</span></div>
<div class="text-xs text-slate-500">Cache: disabled</div>
</div>
<div>
<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Browser</div>
<div class="text-sm font-semibold text-slate-800">no reuse</div>
<div class="text-xs text-slate-500">Reuse: no • Channel: default</div>
</div>
</div>
<div class="space-y-3">
<h4 class="text-xs font-bold text-[#005696] uppercase tracking-wider border-b border-slate-200 pb-1">Inputs</h4>
<div>
<div class="text-sm font-semibold text-slate-800">Env prefix: AUTO_</div>
<div class="text-xs text-slate-500">Defaults: 2 • Overrides: 1 • Items: 0</div>
</div>
<div>
<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assets</div>
<div class="text-sm font-semibold text-slate-800 leading-tight">behaviors.json</div>
<div class="text-xs text-slate-500 mt-1">Curl: none</div>
</div>
</div>
</div>
</div>
<div class="p-6 pt-4 mt-auto border-t border-[#E0E0E0] bg-slate-50/50">
<div class="flex flex-wrap items-end gap-3 w-full">
<div class="flex items-center gap-2 bg-white p-1 rounded border border-[#E0E0E0] shadow-sm mr-auto">
<span class="text-xs font-medium text-slate-500 pl-2 uppercase tracking-wide">Passos:</span>
<input class="w-12 px-1 py-1 text-sm border border-slate-300 rounded text-center focus:ring-[#005696] focus:border-[#005696] font-mono" type="number" value="1"/>
<span class="text-xs text-slate-400">-</span>
<input class="w-12 px-1 py-1 text-sm border border-slate-300 rounded text-center focus:ring-[#005696] focus:border-[#005696] font-mono" type="number" value="3"/>
<button class="ml-1 px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors uppercase tracking-wide border border-transparent hover:border-slate-300">
                                Run Range
                            </button>
</div>
<button class="px-5 py-2 rounded text-[#005696] text-xs font-bold uppercase border border-[#005696] hover:bg-blue-50 transition-colors tracking-wide">
                            Ver plano
                        </button>
<button class="btn-primary px-5 py-2 rounded shadow-sm text-xs transition-colors tracking-wide">
                            Rodar Selecionados
                        </button>
</div>
</div>
</div>
</div>
</main>
<div class="h-12"></div>

</body></html>

<!-- Configuração de Execução (Modal) -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Configuração de Execução - Automation Dashboard</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              brand: {
                 blue: "#005696",
                 yellow: "#FFC107",
                 gray: "#F8F9FA",
                 border: "#E0E0E0",
                 overlay: "rgba(15, 23, 42, 0.6)", // Semi-transparent dark navy
              },
              primary: "#005696", 
              "primary-hover": "#004478",
              "background-light": "#f3f4f1", 
              "background-dark": "#0f172a", 
              "surface-light": "#ffffff",
              "surface-dark": "#1e293b",
            },
            fontFamily: {
              display: ["Inter", "sans-serif"],
              sans: ["Inter", "sans-serif"],
              mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
            },
            borderRadius: {
              DEFAULT: "4px", // 4px radius as requested for inputs
              'xl': "0.75rem",
              '2xl': "1rem",
            },
            boxShadow: {
                'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }
          },
        },
      };
    </script>
<style>
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #475569;
        }
        body {
            font-family: 'Inter', sans-serif;
        }.small-caps {
            font-variant: small-caps;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen relative overflow-hidden font-display transition-colors duration-200">
<div class="absolute inset-0 z-0 pointer-events-none filter blur-[2px] opacity-50 dark:opacity-30 flex flex-col">
<header class="bg-slate-800 text-white p-4 shadow-md h-16 flex items-center justify-between">
<div>
<div class="text-[10px] font-bold tracking-wider opacity-70 uppercase">Automation Dashboard</div>
<div class="text-xl font-bold">Plans, runs, and triggers in one place</div>
</div>
<div class="flex gap-2">
<span class="px-3 py-1 bg-white text-slate-800 rounded-full text-xs font-semibold">Plans</span>
<span class="px-3 py-1 bg-white text-slate-800 rounded-full text-xs font-semibold">Examples</span>
</div>
</header>
<main class="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div class="bg-white p-6 rounded-xl shadow-sm h-64 border border-slate-200"></div>
<div class="bg-white p-6 rounded-xl shadow-sm h-64 border border-slate-200"></div>
<div class="bg-white p-6 rounded-xl shadow-sm h-64 border border-slate-200"></div>
</main>
</div>
<div aria-hidden="true" class="fixed inset-0 bg-brand-overlay z-40 backdrop-blur-sm transition-opacity"></div>
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
<div class="bg-surface-light w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-modal flex flex-col overflow-hidden border border-brand-border transition-colors duration-200">
<div class="px-8 pt-8 pb-4 flex-shrink-0 bg-white border-b border-brand-border">
<div class="flex justify-between items-start">
<div>
<h1 class="text-2xl font-bold text-brand-blue">full-flow</h1>
<p class="text-sm text-slate-500 mt-1">scenarios/full-flow/plan.json</p>
<div class="flex items-center gap-3 mt-3 text-xs text-slate-600 font-medium">
<span>Ticket: FLOW-001</span>
<span class="w-1 h-1 rounded-full bg-slate-300"></span>
<span>Env: local</span>
<span class="w-1 h-1 rounded-full bg-slate-300"></span>
<span>3 steps</span>
</div>
</div>
<button class="px-4 py-1.5 rounded border border-brand-border text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        Close
                    </button>
</div>
</div>
<div class="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar space-y-8 bg-white">
<section>
<div class="flex justify-between items-center mb-3">
<h3 class="text-sm font-bold uppercase tracking-wide text-brand-blue">Inputs for this run</h3>
<button class="px-3 py-1 rounded border border-brand-border text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                            Reset
                        </button>
</div>
<div class="space-y-2">
<label class="block text-xs font-medium text-slate-700">Env prefix</label>
<input class="w-full rounded bg-white border-brand-border text-slate-900 shadow-sm focus:border-brand-blue focus:ring-brand-blue text-sm px-3 py-2" type="text" value="AUTO_"/>
<p class="text-xs text-slate-500">Variaveis AUTO_X viram X no contexto.</p>
</div>
</section>
<hr class="border-brand-border"/>
<section class="rounded-xl p-0">
<div class="flex justify-between items-center mb-2">
<h3 class="text-sm font-bold uppercase tracking-wide text-brand-blue">Defaults</h3>
<button class="px-3 py-1 rounded bg-brand-yellow text-slate-900 font-semibold border border-yellow-500 hover:bg-yellow-400 text-xs transition-colors shadow-sm">
                            Add
                        </button>
</div>
<div class="text-xs text-slate-500 p-4 bg-brand-gray border border-brand-border rounded">
<p>Sem defaults.</p>
<p>Use para valores base (ex: baseUrl, timeout).</p>
</div>
</section>
<hr class="border-brand-border"/>
<section class="rounded-xl p-0">
<div class="flex justify-between items-center mb-2">
<h3 class="text-sm font-bold uppercase tracking-wide text-brand-blue">Overrides</h3>
<button class="px-3 py-1 rounded bg-brand-yellow text-slate-900 font-semibold border border-yellow-500 hover:bg-yellow-400 text-xs transition-colors shadow-sm">
                            Add
                        </button>
</div>
<div class="text-xs text-slate-500 p-4 bg-brand-gray border border-brand-border rounded">
<p>Sem overrides.</p>
<p>Overrides substituem defaults no run.</p>
</div>
</section>
<hr class="border-brand-border"/>
<section class="rounded-xl p-0">
<div class="flex justify-between items-center mb-4">
<h3 class="text-sm font-bold uppercase tracking-wide text-brand-blue">Items / Loop</h3>
<button class="px-3 py-1 rounded bg-brand-yellow text-slate-900 font-semibold border border-yellow-500 hover:bg-yellow-400 text-xs transition-colors shadow-sm">
                            Add item
                        </button>
</div>
<div class="space-y-3">
<div class="flex gap-3 items-start">
<textarea class="flex-1 w-full rounded border-brand-border bg-brand-gray font-mono text-sm text-slate-800 focus:border-brand-blue focus:ring-brand-blue p-3 resize-none border" rows="3">{
  "term": "alpha"
}</textarea>
<button class="px-3 py-2 rounded border border-brand-border text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors bg-white shadow-sm h-min self-center">
                                Remove
                            </button>
</div>
<div class="flex gap-3 items-start">
<textarea class="flex-1 w-full rounded border-brand-border bg-brand-gray font-mono text-sm text-slate-800 focus:border-brand-blue focus:ring-brand-blue p-3 resize-none border" rows="3">{
  "term": "beta"
}</textarea>
<button class="px-3 py-2 rounded border border-brand-border text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors bg-white shadow-sm h-min self-center">
                                Remove
                            </button>
</div>
</div>
<p class="mt-3 text-xs text-slate-500">Cada item é um objeto JSON usado no loop.</p>
</section>
<hr class="border-brand-border"/>
<section>
<div class="flex justify-between items-center mb-3">
<h3 class="text-sm font-bold uppercase tracking-wide text-brand-blue">Steps</h3>
<label class="inline-flex items-center">
<input checked="" class="rounded border-brand-border text-brand-blue shadow-sm focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50 focus:ring-offset-0" type="checkbox"/>
<span class="ml-2 text-sm text-slate-600">Select all</span>
</label>
</div>
<div class="border border-brand-border rounded p-4 bg-white hover:border-slate-300 transition-colors">
<div class="flex items-start gap-3">
<div class="pt-1">
<input checked="" class="rounded border-brand-border text-brand-blue shadow-sm focus:border-brand-blue focus:ring focus:ring-brand-blue focus:ring-opacity-50 focus:ring-offset-0 w-4 h-4" type="checkbox"/>
</div>
<div class="flex-1">
<div class="flex items-center gap-2 mb-1">
<span class="px-1.5 py-0.5 rounded bg-brand-gray text-slate-600 text-[10px] font-bold uppercase tracking-wide border border-brand-border">API</span>
<h4 class="text-sm font-semibold text-slate-900">Looped API call</h4>
</div>
<div class="text-xs text-slate-500 font-mono space-y-0.5 bg-brand-gray p-2 rounded border border-brand-border border-dashed">
<p>#1 api-loop</p>
<p class="truncate">GET https://httpbin.org/get?term={{term}}</p>
</div>
<button class="mt-2 text-xs text-brand-blue font-medium flex items-center hover:text-brand-blue/80 transition-colors">
<span class="material-icons-round text-sm mr-1">play_arrow</span>
                                    Step details
                                </button>
</div>
</div>
</div>
</section>
</div>
<div class="h-6 flex-shrink-0 bg-transparent"></div>
</div>
</div>

</body></html>

<!-- Histórico de Execuções -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Histórico de Runs -  </title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: "#005696", //   Navy
              secondary: "#FFC107", //   Yellow
              "primary-hover": "#00447a",
              "background-light": "#f4f6f8",
              "background-dark": "#1a202c",
              "surface-light": "#ffffff",
              "surface-dark": "#2d3748",
              "text-light": "#333333",
              "text-dark": "#e2e8f0",
              "status-success": "#28A745",
              "status-error": "#DC3545",
              "status-unknown": "#6c757d",
            },
            fontFamily: {
              sans: ["Roboto", "sans-serif"],
            },
            borderRadius: {
              DEFAULT: "4px",
              md: "6px",
              lg: "8px",
            },
          },
        },
      };
    </script>
<style>
        body {
            font-family: 'Roboto', sans-serif;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col min-h-screen">
<header class="bg-primary text-white shadow-md sticky top-0 z-50">
<div class="container mx-auto px-6 py-4 flex justify-between items-center">
<div class="flex items-center space-x-6">
<div class="text-2xl font-bold tracking-tight flex items-center">
<span class="bg-secondary text-primary px-2 py-1 mr-2 font-black rounded text-sm uppercase"> </span>
<span>Automação</span>
</div>
<nav class="hidden md:flex space-x-8 text-sm font-medium ml-8">
<a class="opacity-80 hover:opacity-100 transition-opacity hover:text-secondary" href="#">Dashboard</a>
<a class="opacity-100 border-b-2 border-secondary pb-1 text-white" href="#">Histórico</a>
<a class="opacity-80 hover:opacity-100 transition-opacity hover:text-secondary" href="#">Configurações</a>
</nav>
</div>
<div class="flex items-center space-x-4">
<div class="relative hidden sm:block">
<input class="pl-10 pr-4 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 focus:border-white/50 text-sm w-64 transition-all" placeholder="Buscar execução..." type="text"/>
<span class="material-symbols-outlined absolute left-2.5 top-2 text-white/70 text-[20px]">search</span>
</div>
<div class="flex items-center space-x-2">
<button class="p-2 hover:bg-white/10 rounded-full transition-colors">
<span class="material-symbols-outlined text-[24px]">notifications</span>
</button>
<button class="p-2 hover:bg-white/10 rounded-full transition-colors">
<span class="material-symbols-outlined text-[24px]">account_circle</span>
</button>
<button class="p-2 hover:bg-white/10 rounded-full transition-colors" onclick="document.documentElement.classList.toggle('dark')">
<span class="material-symbols-outlined text-[24px]">dark_mode</span>
</button>
</div>
</div>
</div>
<div class="h-1 bg-secondary w-full"></div>
</header>
<main class="flex-grow container mx-auto px-6 py-8">
<div class="mb-8">
<div class="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center font-medium">
<span class="material-symbols-outlined text-sm mr-1">home</span> Início <span class="mx-2 text-gray-300">/</span> Histórico de Runs
        </div>
<h1 class="text-3xl font-bold text-primary dark:text-white mb-2">Histórico de Runs</h1>
<p class="text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
            Visualize e gerencie o registro completo de todas as automações executadas na plataforma. Utilize os filtros abaixo para refinar sua busca por período, status ou identificador.
        </p>
</div>
<div class="bg-white dark:bg-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
<div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
<div class="md:col-span-3">
<label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Período</label>
<div class="relative">
<input class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:text-white transition-shadow" type="date"/>
</div>
</div>
<div class="md:col-span-3">
<label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Status</label>
<select class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:text-white transition-shadow">
<option value="all">Todos os Status</option>
<option value="ok">OK</option>
<option value="fail">Fail</option>
<option value="unknown">Unknown</option>
</select>
</div>
<div class="md:col-span-4">
<label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Busca Avançada</label>
<div class="relative">
<input class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-4 py-2.5 pl-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary dark:text-white transition-shadow" placeholder="ID da Run, Ticket ou Nome..." type="text"/>
<span class="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
</div>
</div>
<div class="md:col-span-2 flex space-x-2">
<button class="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-4 rounded transition-colors text-sm flex justify-center items-center shadow-sm uppercase tracking-wide">
                    Filtrar
                </button>
<button class="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-medium py-2.5 px-3 rounded transition-colors text-sm flex items-center shadow-sm" title="Exportar CSV">
<span class="material-symbols-outlined text-[20px]">download</span>
</button>
</div>
</div>
</div>
<div class="space-y-5">
<div class="bg-white dark:bg-surface-dark rounded-lg shadow-sm border-l-4 border-l-status-success border-t border-r border-b border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
<div class="flex flex-col md:flex-row justify-between items-start mb-5">
<div>
<div class="flex items-center gap-3 mb-1">
<h3 class="text-lg font-bold text-primary dark:text-white">Conciliação Bancária Diária</h3>
<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-status-success border border-green-200 uppercase tracking-wide flex items-center gap-1">
<span class="material-symbols-outlined text-[12px] align-middle">check_circle</span> OK
                        </span>
</div>
<div class="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center">
<span class="material-symbols-outlined text-[14px] mr-1">tag</span> Run ID: 20260117080012_45821
                    </div>
</div>
<div class="mt-4 md:mt-0 flex items-center space-x-3 text-sm text-gray-500">
<div class="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        Produção
                    </div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm text-gray-600 dark:text-gray-300 mb-6">
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Ticket Relacionado</p>
<p class="font-mono bg-gray-50 dark:bg-gray-800/50 inline-block px-2 py-1 rounded border border-gray-100 dark:border-gray-700">FIN-001</p>
</div>
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tempo de Execução</p>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
<span>08:00:00 - 08:04:12</span>
<span class="text-xs text-gray-400">(4m 12s)</span>
</div>
</div>
<div class="lg:col-span-6">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Resumo dos Steps</p>
<div class="bg-gray-50 dark:bg-gray-800/50 rounded p-2 border border-gray-100 dark:border-gray-700 flex gap-4 text-xs font-mono">
<span class="font-bold text-gray-600 dark:text-gray-400">Total: 8</span>
<span class="font-bold text-status-success">OK: 8</span>
<span class="font-bold text-gray-400">FAIL: 0</span>
<span class="font-bold text-gray-400">SKIP: 0</span>
</div>
</div>
</div>
<div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
<button class="px-4 py-2 bg-secondary text-gray-900 border border-secondary rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">replay</span> Reexecutar
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                    Abrir Detalhes
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">description</span> Logs
                </button>
<div class="flex-grow"></div>
<button class="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm font-medium transition-colors border border-transparent hover:border-red-100">
                    Deletar
                </button>
</div>
</div>
<div class="bg-white dark:bg-surface-dark rounded-lg shadow-sm border-l-4 border-l-status-error border-t border-r border-b border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
<div class="flex flex-col md:flex-row justify-between items-start mb-5">
<div>
<div class="flex items-center gap-3 mb-1">
<h3 class="text-lg font-bold text-primary dark:text-white">Sincronização CRM - Salesforce</h3>
<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-status-error border border-red-100 uppercase tracking-wide flex items-center gap-1">
<span class="material-symbols-outlined text-[12px] align-middle">error</span> FAIL
                        </span>
</div>
<div class="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center">
<span class="material-symbols-outlined text-[14px] mr-1">tag</span> Run ID: 20260117074510_45820
                    </div>
</div>
<div class="mt-4 md:mt-0 flex items-center space-x-3 text-sm text-gray-500">
<div class="bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                        Homologação
                    </div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm text-gray-600 dark:text-gray-300 mb-6">
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Ticket Relacionado</p>
<p class="font-mono bg-gray-50 dark:bg-gray-800/50 inline-block px-2 py-1 rounded border border-gray-100 dark:border-gray-700">CRM-542</p>
</div>
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tempo de Execução</p>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
<span>07:45:00 - 07:45:45</span>
<span class="text-xs text-gray-400">(45s)</span>
</div>
</div>
<div class="lg:col-span-6">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Resumo dos Steps</p>
<div class="bg-red-50 dark:bg-red-900/10 rounded p-2 border border-red-100 dark:border-red-900/30 flex gap-4 text-xs font-mono">
<span class="font-bold text-gray-600 dark:text-gray-400">Total: 5</span>
<span class="font-bold text-status-success">OK: 2</span>
<span class="font-bold text-status-error">FAIL: 1</span>
<span class="font-bold text-gray-500">SKIP: 2</span>
</div>
</div>
</div>
<div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
<button class="px-4 py-2 bg-secondary text-gray-900 border border-secondary rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">replay</span> Reexecutar
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                    Abrir Detalhes
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">description</span> Logs
                </button>
<div class="flex-grow"></div>
<button class="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm font-medium transition-colors border border-transparent hover:border-red-100">
                    Deletar
                </button>
</div>
</div>
<div class="bg-white dark:bg-surface-dark rounded-lg shadow-sm border-l-4 border-l-status-unknown border-t border-r border-b border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md opacity-90">
<div class="flex flex-col md:flex-row justify-between items-start mb-5">
<div>
<div class="flex items-center gap-3 mb-1">
<h3 class="text-lg font-bold text-primary dark:text-white">Backup Noturno Banco de Dados</h3>
<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide flex items-center gap-1">
<span class="material-symbols-outlined text-[12px] align-middle">help</span> UNKNOWN
                        </span>
</div>
<div class="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center">
<span class="material-symbols-outlined text-[14px] mr-1">tag</span> Run ID: 20260117030005_45819
                    </div>
</div>
<div class="mt-4 md:mt-0 flex items-center space-x-3 text-sm text-gray-500">
<div class="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        Produção
                    </div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm text-gray-600 dark:text-gray-300 mb-6">
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Ticket Relacionado</p>
<p class="font-mono text-gray-400">--</p>
</div>
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tempo de Execução</p>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
<span class="italic text-gray-400">Dados não disponíveis</span>
</div>
</div>
<div class="lg:col-span-6">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Resumo dos Steps</p>
<div class="bg-gray-50 dark:bg-gray-800/50 rounded p-2 border border-gray-100 dark:border-gray-700 flex gap-4 text-xs font-mono text-gray-400 italic">
                         Aguardando sincronização de logs...
                    </div>
</div>
</div>
<div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
<button class="px-4 py-2 bg-secondary text-gray-900 border border-secondary rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">replay</span> Reexecutar
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                    Abrir Detalhes
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">description</span> Logs
                </button>
<div class="flex-grow"></div>
<button class="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm font-medium transition-colors border border-transparent hover:border-red-100">
                    Deletar
                </button>
</div>
</div>
<div class="bg-white dark:bg-surface-dark rounded-lg shadow-sm border-l-4 border-l-status-success border-t border-r border-b border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
<div class="flex flex-col md:flex-row justify-between items-start mb-5">
<div>
<div class="flex items-center gap-3 mb-1">
<h3 class="text-lg font-bold text-primary dark:text-white">Geração Relatório Mensal</h3>
<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-status-success border border-green-200 uppercase tracking-wide flex items-center gap-1">
<span class="material-symbols-outlined text-[12px] align-middle">check_circle</span> OK
                        </span>
</div>
<div class="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center">
<span class="material-symbols-outlined text-[14px] mr-1">tag</span> Run ID: 20260116183000_45818
                    </div>
</div>
<div class="mt-4 md:mt-0 flex items-center space-x-3 text-sm text-gray-500">
<div class="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                        Local
                    </div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm text-gray-600 dark:text-gray-300 mb-6">
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Ticket Relacionado</p>
<p class="font-mono bg-gray-50 dark:bg-gray-800/50 inline-block px-2 py-1 rounded border border-gray-100 dark:border-gray-700">OPS-110</p>
</div>
<div class="lg:col-span-3 space-y-1">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tempo de Execução</p>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
<span>15/01/2026 18:30:00 - 18:42:10</span>
</div>
</div>
<div class="lg:col-span-6">
<p class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Resumo dos Steps</p>
<div class="bg-gray-50 dark:bg-gray-800/50 rounded p-2 border border-gray-100 dark:border-gray-700 flex gap-4 text-xs font-mono">
<span class="font-bold text-gray-600 dark:text-gray-400">Total: 12</span>
<span class="font-bold text-status-success">OK: 12</span>
<span class="font-bold text-gray-400">FAIL: 0</span>
<span class="font-bold text-gray-400">SKIP: 0</span>
</div>
</div>
</div>
<div class="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
<button class="px-4 py-2 bg-secondary text-gray-900 border border-secondary rounded text-sm font-bold hover:bg-yellow-400 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">replay</span> Reexecutar
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                    Abrir Detalhes
                </button>
<button class="px-4 py-2 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center">
<span class="material-symbols-outlined text-[18px] mr-1.5">description</span> Logs
                </button>
<div class="flex-grow"></div>
<button class="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm font-medium transition-colors border border-transparent hover:border-red-100">
                    Deletar
                </button>
</div>
</div>
</div>
<div class="px-6 py-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-surface-dark rounded-lg mt-6 shadow-sm">
<div class="text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-0">
            Mostrando <span class="font-bold text-primary dark:text-gray-200">1</span> a <span class="font-bold text-primary dark:text-gray-200">4</span> de <span class="font-bold text-primary dark:text-gray-200">148</span> runs
        </div>
<div class="flex space-x-1">
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50" disabled="">
<span class="material-symbols-outlined text-sm align-middle">chevron_left</span>
</button>
<button class="px-3 py-1 border border-primary bg-primary text-white rounded-md text-sm font-medium shadow-sm">1</button>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">2</button>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">3</button>
<span class="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">12</button>
<button class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
<span class="material-symbols-outlined text-sm align-middle">chevron_right</span>
</button>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
<div class="bg-white dark:bg-surface-dark p-6 rounded-lg border-b-4 border-b-status-success shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
<div>
<p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Taxa de Sucesso (Hoje)</p>
<p class="text-2xl font-black text-primary dark:text-white">98.5%</p>
</div>
<div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-full">
<span class="material-symbols-outlined text-status-success text-2xl">trending_up</span>
</div>
</div>
<div class="bg-white dark:bg-surface-dark p-6 rounded-lg border-b-4 border-b-primary shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
<div>
<p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Execuções (Mês)</p>
<p class="text-2xl font-black text-primary dark:text-white">1,240</p>
</div>
<div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
<span class="material-symbols-outlined text-primary text-2xl">analytics</span>
</div>
</div>
<div class="bg-white dark:bg-surface-dark p-6 rounded-lg border-b-4 border-b-secondary shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
<div>
<p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tempo Médio</p>
<p class="text-2xl font-black text-primary dark:text-white">3m 12s</p>
</div>
<div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
<span class="material-symbols-outlined text-yellow-600 dark:text-yellow-500 text-2xl">timer</span>
</div>
</div>
</div>
</main>
<footer class="bg-primary text-white py-10 border-t-8 border-secondary mt-auto">
<div class="container mx-auto px-6">
<div class="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
<div class="mb-6 md:mb-0">
<div class="text-2xl font-bold tracking-tight flex justify-center md:justify-start items-center mb-3">
<span class="bg-secondary text-primary px-2 py-1 mr-2 font-black rounded text-sm uppercase"> </span>
<span>Automação</span>
</div>
<p class="text-blue-100 text-sm max-w-sm leading-relaxed">Plataforma interna oficial de orquestração e monitoramento de processos automatizados.</p>
</div>
<div class="flex space-x-6">
<a class="text-white hover:text-secondary transition-colors" href="#"><span class="material-symbols-outlined">help_outline</span></a>
<a class="text-white hover:text-secondary transition-colors" href="#"><span class="material-symbols-outlined">settings</span></a>
<a class="text-white hover:text-secondary transition-colors" href="#"><span class="material-symbols-outlined">security</span></a>
</div>
</div>
<div class="mt-8 pt-8 border-t border-blue-800 flex flex-col md:flex-row justify-between items-center text-xs text-blue-200">
<p>© 2026  . Todos os direitos reservados.</p>
<div class="mt-2 md:mt-0 flex space-x-4">
<a class="hover:text-white" href="#">Termos de Uso</a>
<a class="hover:text-white" href="#">Política de Privacidade</a>
<a class="hover:text-white" href="#">Suporte</a>
</div>
</div>
</div>
</footer>

</body></html>

<!-- Configuração de Gatilhos -->
<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Configuração de Gatilhos - Automação</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              primary: "#005696", // Navy Blue
              secondary: "#FFC107", // Yellow
              "secondary-hover": "#FFB300",
              "background-light": "#F4F6F8",
              "background-dark": "#121212",
              "surface-light": "#FFFFFF",
              "surface-dark": "#1E1E1E",
              "border-light": "#E0E0E0",
              "border-dark": "#333333",
              "text-light": "#333333",
              "text-dark": "#E0E0E0",
              "text-muted": "#666666",
              "text-muted-dark": "#999999",
              "empty-state": "#9E9E9E",
            },
            fontFamily: {
              display: ["Roboto", "sans-serif"],
              sans: ["Roboto", "sans-serif"],
            },
            borderRadius: {
              DEFAULT: "0.5rem", // 8px consistent
              lg: "0.5rem",
              xl: "0.5rem",
            },
          },
        },
      };
    </script>
</head>
<body class="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased min-h-screen flex flex-col transition-colors duration-200">
<header class="bg-primary text-white shadow-md">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
<div>
<div class="text-xs uppercase tracking-wider text-gray-300 font-semibold mb-1">Painel de Automação</div>
<h1 class="text-2xl font-bold leading-tight">Planos, execuções e gatilhos</h1>
<p class="text-sm text-gray-300 mt-1">Gerencie seus fluxos de trabalho e integrações em um só lugar.</p>
</div>
<nav class="flex flex-wrap gap-2 justify-center md:justify-end">
<a class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition" href="#">Planos</a>
<a class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition" href="#">Exemplos</a>
<a class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition" href="#">Execuções</a>
<a class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition" href="#">Runs</a>
<a class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition" href="#">Relatórios</a>
<a class="px-4 py-2 rounded-full bg-white text-primary text-sm font-bold shadow-sm transition" href="#">Gatilhos</a>
</nav>
</div>
</header>
<main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
<div class="flex flex-wrap gap-2 mb-8">
<button class="px-4 py-1.5 rounded-full text-sm font-medium border border-transparent text-text-muted dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition">Planos</button>
<button class="px-4 py-1.5 rounded-full text-sm font-medium border border-transparent text-text-muted dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition">Exemplos</button>
<button class="px-4 py-1.5 rounded-full text-sm font-medium border border-transparent text-text-muted dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition">Execuções</button>
<button class="px-4 py-1.5 rounded-full text-sm font-medium border border-transparent text-text-muted dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition">Runs</button>
<button class="px-4 py-1.5 rounded-full text-sm font-medium border border-transparent text-text-muted dark:text-text-muted-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition">Relatórios</button>
<button class="px-4 py-1.5 rounded-full text-sm font-medium bg-[#005696]/10 text-[#005696] border border-[#005696]/20 shadow-sm cursor-default font-bold">Gatilhos</button>
</div>
<div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
<div>
<h2 class="text-2xl font-bold text-text-light dark:text-text-dark mb-1">Gatilhos</h2>
<p class="text-text-muted dark:text-text-muted-dark">Crie e gerencie o status dos seus gatilhos de automação.</p>
</div>
<button class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm font-medium transition text-sm">
<span class="material-symbols-outlined text-[20px]">refresh</span>
                Atualizar
            </button>
</div>
<div class="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark p-6 mb-8">
<div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
<div class="md:col-span-3">
<label class="block text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wide mb-1" for="triggerName">Nome do Gatilho</label>
<input class="w-full rounded-lg border-border-light dark:border-gray-600 bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:border-primary focus:ring-primary text-sm shadow-sm" id="triggerName" placeholder="Ex: Cron Diário" type="text"/>
</div>
<div class="md:col-span-3">
<label class="block text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wide mb-1" for="triggerType">Tipo de Evento</label>
<select class="w-full rounded-lg border-border-light dark:border-gray-600 bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:border-primary focus:ring-primary text-sm shadow-sm" id="triggerType">
<option selected="" value="eventbridge">eventbridge</option>
<option value="webhook">webhook</option>
<option value="scheduler">scheduler</option>
</select>
</div>
<div class="md:col-span-2">
<label class="block text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wide mb-1" for="target">Alvo (Target)</label>
<input class="w-full rounded-lg border-border-light dark:border-gray-600 bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:border-primary focus:ring-primary text-sm shadow-sm" id="target" placeholder="Lambda/Arn" type="text"/>
</div>
<div class="md:col-span-2">
<label class="block text-xs font-semibold text-text-muted dark:text-text-muted-dark uppercase tracking-wide mb-1" for="logsUrl">URL de Logs</label>
<input class="w-full rounded-lg border-border-light dark:border-gray-600 bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:border-primary focus:ring-primary text-sm shadow-sm" id="logsUrl" placeholder="https://..." type="text"/>
</div>
<div class="md:col-span-2">
<button class="w-full px-4 py-2 bg-secondary hover:bg-secondary-hover text-primary font-bold rounded-lg shadow-sm transition flex justify-center items-center gap-2">
<span class="material-symbols-outlined text-[20px]">add</span>
                        Criar
                    </button>
</div>
</div>
</div>
<div class="border-2 border-dashed border-border-light dark:border-gray-700 rounded-lg p-12 text-center bg-transparent flex flex-col items-center justify-center min-h-[200px]">
<span class="material-symbols-outlined text-[#9E9E9E] text-5xl mb-3">power_off</span>
<p class="text-[#9E9E9E] font-medium text-lg">Nenhum gatilho configurado</p>
<p class="text-sm text-[#9E9E9E] mt-1">Utilize o formulário acima para criar um novo gatilho para suas automações.</p>
</div>
</main>
<footer class="bg-white dark:bg-surface-dark border-t border-border-light dark:border-border-dark mt-auto">
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
<p class="text-center text-sm text-text-muted dark:text-text-muted-dark">
                © 2023 Dashboard de Automação. Todos os direitos reservados.
            </p>
</div>
</footer>

</body></html>