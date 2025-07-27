// Initialize Lucide icons
        lucide.createIcons();
        
        document.addEventListener('DOMContentLoaded', () => {
            const codeBeforeEl = document.getElementById('code-before');
            const codeAfterEl = document.getElementById('code-after');
            const compareBtn = document.getElementById('compare-btn');
            const btnText = document.getElementById('btn-text');
            const btnContent = document.getElementById('btn-content');
            const resultContainer = document.getElementById('result-container');
            const diffOutputEl = document.getElementById('diff-output');
            const clearBtn = document.getElementById('clear-btn');
            const statsEl = document.getElementById('stats');
            const copyBeforeBtn = document.getElementById('copy-before');
            const copyAfterBtn = document.getElementById('copy-after');
            const ignoreWhitespaceToggle = document.getElementById('ignore-whitespace-toggle');
            
            let ignoreWhitespace = false;
            let isComparing = false;

            // Lógica de chave seletora
            const updateToggleState = (active) => {
                ignoreWhitespace = active;
                ignoreWhitespaceToggle.classList.toggle('active', active);
                ignoreWhitespaceToggle.setAttribute('aria-checked', active.toString());
            };

            ignoreWhitespaceToggle.addEventListener('click', () => updateToggleState(!ignoreWhitespace));
            ignoreWhitespaceToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateToggleState(!ignoreWhitespace);
                }
            });

            // Funcionalidade de cópia com UX 
            const handleCopy = async (element, button) => {
                if (!element.value.trim()) return;
                
                try {
                    await navigator.clipboard.writeText(element.value);
                    
                    const icon = button.querySelector('i');
                    const originalDataLucide = icon.getAttribute('data-lucide');
                    
                    // Update icon and style
                    icon.setAttribute('data-lucide', 'check');
                    button.style.color = '#10b981';
                    lucide.createIcons();
                    
                    // Reiniciar após 2 segundos
                    setTimeout(() => {
                        icon.setAttribute('data-lucide', originalDataLucide);
                        button.style.color = '';
                        lucide.createIcons();
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            };

            copyBeforeBtn.addEventListener('click', () => handleCopy(codeBeforeEl, copyBeforeBtn));
            copyAfterBtn.addEventListener('click', () => handleCopy(codeAfterEl, copyAfterBtn));

            // Mostrar/Ocultar botões de cópia
            const toggleCopyButton = (textarea, button) => {
                button.style.opacity = textarea.value.trim() ? '1' : '0';
            };

            codeBeforeEl.addEventListener('input', () => toggleCopyButton(codeBeforeEl, copyBeforeBtn));
            codeAfterEl.addEventListener('input', () => toggleCopyButton(codeAfterEl, copyAfterBtn));

            // Ativar/Desativar Botão Comparar
            const updateCompareButtonState = () => {
                const hasContent = codeBeforeEl.value.trim() && codeAfterEl.value.trim();
                compareBtn.disabled = !hasContent || isComparing;
                
                if (!hasContent) {
                    btnText.textContent = 'Comparar Códigos';
                } else if (!isComparing) {
                    btnText.textContent = 'Comparar Códigos';
                }
            };

            codeBeforeEl.addEventListener('input', updateCompareButtonState);
            codeAfterEl.addEventListener('input', updateCompareButtonState);

            // Comparar ação do botão
            compareBtn.addEventListener('click', async () => {
                if (compareBtn.disabled) return;
                
                isComparing = true;
                updateCompareButtonState();
                
                // Atualizar estado do botão
                btnContent.innerHTML = `
                    <div class="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    <span class="loading-dots">Analisando</span>
                `;
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                try {
                    renderDiff();
                } finally {
                    isComparing = false;
                    btnContent.innerHTML = `
                        <i data-lucide="git-compare" class="w-5 h-5"></i>
                        <span>Comparar Códigos</span>
                    `;
                    lucide.createIcons();
                    updateCompareButtonState();
                }
            });

            // Renderização de Diff Aprimorada
            const renderDiff = () => {
                let textBefore = codeBeforeEl.value;
                let textAfter = codeAfterEl.value;

                // Normalizar espaços em branco se a opção estiver habilitada
                if (ignoreWhitespace) {
                    const normalize = (text) => text.split('\n').map(line => line.trim()).join('\n');
                    textBefore = normalize(textBefore);
                    textAfter = normalize(textAfter);
                }
                
                const diff = Diff.diffLines(textBefore, textAfter, { newlineIsToken: true });
                let htmlResult = '';
                let additions = 0;
                let deletions = 0;
                let lineNumBefore = 1;
                let lineNumAfter = 1;

                // Resultados de comparação de processo
                diff.forEach(part => {
                    const lines = part.value.replace(/\n$/, '').split('\n');
                    
                    lines.forEach((line, index) => {
                        // Pular linhas vazias no final
                        if (line === '' && index === lines.length - 1 && lines.length > 1) return;
                        
                        const escapedLine = escapeHtml(line);
                        
                        if (part.added) {
                            additions++;
                            htmlResult += `
                                <div class="diff-line added" role="row">
                                    <span class="diff-line-number" aria-label="Linha original"></span>
                                    <span class="diff-line-number" aria-label="Linha ${lineNumAfter}">${lineNumAfter++}</span>
                                    <span class="diff-indicator text-green-400" aria-label="Linha adicionada">+</span>
                                    <div class="diff-content">${escapedLine || '&nbsp;'}</div>
                                </div>`;
                        } else if (part.removed) {
                            deletions++;
                            htmlResult += `
                                <div class="diff-line removed" role="row">
                                    <span class="diff-line-number" aria-label="Linha ${lineNumBefore}">${lineNumBefore++}</span>
                                    <span class="diff-line-number" aria-label="Linha modificada"></span>
                                    <span class="diff-indicator text-red-400" aria-label="Linha removida">-</span>
                                    <div class="diff-content">${escapedLine || '&nbsp;'}</div>
                                </div>`;
                        } else {
                            htmlResult += `
                                <div class="diff-line" role="row">
                                    <span class="diff-line-number" aria-label="Linha ${lineNumBefore}">${lineNumBefore++}</span>
                                    <span class="diff-line-number" aria-label="Linha ${lineNumAfter}">${lineNumAfter++}</span>
                                    <span class="diff-indicator text-gray-500" aria-label="Linha inalterada"> </span>
                                    <div class="diff-content text-gray-300">${escapedLine || '&nbsp;'}</div>
                                </div>`;
                        }
                    });
                });

                if (htmlResult) {
                    diffOutputEl.innerHTML = `<div role="table" aria-label="Comparação de código">${htmlResult}</div>`;
                } else {
                    diffOutputEl.innerHTML = `
                        <div class="flex flex-col items-center justify-center py-12 text-center">
                            <i data-lucide="check-circle" class="w-12 h-12 text-green-400 mb-4"></i>
                            <h3 class="text-lg font-medium text-white mb-2">Nenhuma diferença encontrada</h3>
                            <p class="text-gray-400">Os códigos são idênticos</p>
                        </div>`;
                    lucide.createIcons();
                }

                updateStats(additions, deletions);
                
                // Mostrar resultados com animação suave
                resultContainer.classList.remove('hidden');
                setTimeout(() => {
                    resultContainer.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }, 100);
            };

            const updateStats = (additions, deletions) => {
                const total = additions + deletions;
                const statsHTML = [];

                if (additions > 0) {
                    statsHTML.push(`
                        <div class="stats-badge additions">
                            <i data-lucide="plus" class="w-3 h-3"></i>
                            <span>${additions} ${additions === 1 ? 'adição' : 'adições'}</span>
                        </div>
                    `);
                }

                if (deletions > 0) {
                    statsHTML.push(`
                        <div class="stats-badge deletions">
                            <i data-lucide="minus" class="w-3 h-3"></i>
                            <span>${deletions} ${deletions === 1 ? 'remoção' : 'remoções'}</span>
                        </div>
                    `);
                }

                if (total === 0) {
                    statsHTML.push(`
                        <div class="stats-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success);">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span>Códigos idênticos</span>
                        </div>
                    `);
                }

                statsEl.innerHTML = statsHTML.join('');
                lucide.createIcons();
            };

            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };

            // Ação do botão Limpar
            clearBtn.addEventListener('click', () => {
                
                resultContainer.style.opacity = '0';
                resultContainer.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    resultContainer.classList.add('hidden');
                    resultContainer.style.opacity = '';
                    resultContainer.style.transform = '';
                    
                    codeBeforeEl.value = '';
                    codeAfterEl.value = '';
                    
                    copyBeforeBtn.style.opacity = '0';
                    copyAfterBtn.style.opacity = '0';
                    
                    updateCompareButtonState();
                    
                    codeBeforeEl.focus();
                    codeBeforeEl.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 200);
            });

            // Atalhos de teclado
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + Enter 
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (!compareBtn.disabled) {
                        compareBtn.click();
                    }
                }
                
                if (e.key === 'Escape' && !resultContainer.classList.contains('hidden')) {
                    e.preventDefault();
                    clearBtn.click();
                }
            });

            const autoResize = (textarea) => {
                textarea.style.height = 'auto';
                textarea.style.height = Math.max(300, textarea.scrollHeight) + 'px';
            };

            codeBeforeEl.addEventListener('input', () => autoResize(codeBeforeEl));
            codeAfterEl.addEventListener('input', () => autoResize(codeAfterEl));


            const setupDragAndDrop = (textarea, label) => {
                let dragCounter = 0;

                textarea.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    dragCounter++;
                    textarea.style.borderColor = 'var(--color-primary)';
                    textarea.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                });

                textarea.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    dragCounter--;
                    if (dragCounter === 0) {
                        textarea.style.borderColor = '';
                        textarea.style.backgroundColor = '';
                    }
                });

                textarea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });

                textarea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dragCounter = 0;
                    textarea.style.borderColor = '';
                    textarea.style.backgroundColor = '';

                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('text/') || file.name.match(/\.(js|html|css|json|xml|md|txt|py|java|cpp|c|php|rb|go|rs|ts|jsx|tsx|vue|svelte)$/i)) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                textarea.value = event.target.result;
                                autoResize(textarea);
                                toggleCopyButton(textarea, textarea === codeBeforeEl ? copyBeforeBtn : copyAfterBtn);
                                updateCompareButtonState();
                            };
                            reader.readAsText(file);
                        }
                    }
                });
            };

            setupDragAndDrop(codeBeforeEl, 'original');
            setupDragAndDrop(codeAfterEl, 'modified');

            toggleCopyButton(codeBeforeEl, copyBeforeBtn);
            toggleCopyButton(codeAfterEl, copyAfterBtn);
            updateCompareButtonState();

            codeBeforeEl.addEventListener('focus', () => {
                codeBeforeEl.parentElement.parentElement.style.borderColor = 'var(--color-primary)';
            });

            codeBeforeEl.addEventListener('blur', () => {
                codeBeforeEl.parentElement.parentElement.style.borderColor = '';
            });

            codeAfterEl.addEventListener('focus', () => {
                codeAfterEl.parentElement.parentElement.style.borderColor = 'var(--color-primary)';
            });

            codeAfterEl.addEventListener('blur', () => {
                codeAfterEl.parentElement.parentElement.style.borderColor = '';
            });

  
            const createTooltip = (element, text) => {
                element.setAttribute('title', text);
                element.addEventListener('mouseenter', () => {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 pointer-events-none';
                    tooltip.style.bottom = '100%';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%) translateY(-4px)';
                    tooltip.textContent = text;
                    element.style.position = 'relative';
                    element.appendChild(tooltip);
                });

                element.addEventListener('mouseleave', () => {
                    const tooltip = element.querySelector('div[class*="absolute"]');
                    if (tooltip) tooltip.remove();
                });
            };

            createTooltip(ignoreWhitespaceToggle, 'Ctrl+Enter para comparar rapidamente');
            createTooltip(compareBtn, 'Pressione Ctrl+Enter como atalho');


            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            const debouncedUpdateCompareButton = debounce(updateCompareButtonState, 100);
            codeBeforeEl.addEventListener('input', debouncedUpdateCompareButton);
            codeAfterEl.addEventListener('input', debouncedUpdateCompareButton);

            updateCompareButtonState();
        });