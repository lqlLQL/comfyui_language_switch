(function() {
    "use strict";

    const DEBUG_MODE = true;
    const MAX_RETRY = 5;
    const RETRY_INTERVAL = 500;

    function createLanguageButton() {
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'comfyui-button-group';
        buttonGroup.style.marginLeft = '8px';

        const button = document.createElement('button');
        button.className = 'comfyui-button comfyui-menu-mobile-collapse';
        button.title = '切换语言 (中/EN)';
        button.innerHTML = `
            <span style="line-height: 0.4em;">
                <span class="lang-text" style="font-size: 0.6em;">EN<br>中</span>
            </span>
        `;

        // 核心修复：动态获取语言选项
        button.onclick = async () => {
            try {
                // 1. 确保设置面板已打开（关键修复）
                const settingsButton = getSettingsButton();
                if (!document.querySelector('.comfy-settings-panel')) {
                    settingsButton?.click();
                    await new Promise(r => setTimeout(r, 0)); // 等待面板展开
                    document.querySelector('.p-dialog').style.opacity = '0';
                }

                // 2. 获取语言组件（新增容错）
                const localeComponent = document.querySelector('#Comfy\\.Locale');
                if (!localeComponent) {
                    console.error('[错误] 未找到语言组件');
                    return;
                }

                // 3. 触发下拉展开（部分版本需要）
                localeComponent.querySelector('.p-select-label')?.click();
                await new Promise(r => setTimeout(r, 0));
                document.querySelector('.p-select-overlay').style.opacity = '0';

                // 4. 获取当前语言（修复获取方式）
                const currentLang = localeComponent.textContent?.trim();
                const targetLang = currentLang === '中文' ? 'English' : '中文';

                // 5. 精准定位选项（新增li过滤）
                const targetOption = document.querySelector(
                    `#Comfy\\.Locale_list li[aria-label="${targetLang}"]`
                );
                
                if (!targetOption) {
                    console.error(`[错误] 未找到语言选项: ${targetLang}`);
                    return;
                }

                // 6. 触发完整事件链
                targetOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                targetOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                targetOption.dispatchEvent(new MouseEvent('click', { 
                    bubbles: true,
                    composed: true  // 确保穿透Shadow DOM
                }));

                // 7. 强制触发更新
                setTimeout(() => {
                    localeComponent.dispatchEvent(new Event('change', { bubbles: true }));
                    document.querySelector('.p-dialog-close-button')?.click(); // 自动关闭设置面板
                    console.log(`关闭面板`);
                }, 0);

                console.log(`[成功] 已切换至: ${targetLang}`);
            } catch (error) {
                console.error('[异常] 切换失败:', error);
            }
        };

        buttonGroup.appendChild(button);
        return buttonGroup;
    }
    
    // 新增：动态适配中英文界面的设置按钮
    function getSettingsButton() {
        // 尝试匹配中英文界面的设置按钮
        return document.querySelector('button[aria-label="设置"], button[aria-label="Settings"]')
    }


    // 修复后的定位逻辑（三级策略）
    function findInsertPosition() {
        // 方案1: 精准匹配 SD-PPP 按钮组
        const sdpppButton = document.querySelector('.comfyui-button-group button');
        if (sdpppButton) {
            return sdpppButton.closest('.comfyui-button-group');
        }

        // 方案2: 匹配首个自定义按钮组
        const customButtons = document.querySelectorAll('.comfyui-button-group');
        if (customButtons.length > 0) {
            DEBUG_MODE && console.log('[定位] 使用第一个自定义按钮组作为参考');
            return customButtons[0];
        }

        // 方案3: 插入工具栏末尾
        DEBUG_MODE && console.log('[定位] 插入到工具栏末尾');
        return document.querySelector('.comfy-menu');
    }

    // 修复后的插入逻辑（带样式保护）
    function insertButton() {
        const referenceNode = findInsertPosition();
        const button = createLanguageButton();

        // 样式强化（防止被覆盖）
        button.style.position = 'relative';
        button.style.zIndex = '9999';

        if (referenceNode?.parentNode) {
            referenceNode.parentNode.insertBefore(button, referenceNode.nextSibling);
            DEBUG_MODE && console.log('[插入] 成功插入到参考节点旁');
        } else {
            const menu = document.querySelector('.comfy-menu');
            if (menu) {
                menu.appendChild(button);
                menu.style.position = 'relative'; // 防止 overflow 隐藏
                DEBUG_MODE && console.log('[插入] 插入到工具栏末尾');
            }
        }
    }

    // 保留你原有的初始化逻辑
    function init(retryCount = 0) {
        try {
            if (retryCount >= MAX_RETRY) {
                console.error('[错误] 超过最大重试次数');
                return;
            }

            if (!document.querySelector('.comfy-menu')) {
                DEBUG_MODE && console.log(`[重试] 第 ${retryCount + 1} 次尝试`);
                setTimeout(() => init(retryCount + 1), RETRY_INTERVAL);
                return;
            }

            insertButton();
            DEBUG_MODE && console.log('[成功] 按钮初始化完成');
        } catch (error) {
            console.error('[异常] 初始化失败:', error);
        }
    }

    // 启动入口（保持你原有的事件监听）
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
        document.addEventListener('DOMContentLoaded', init);
    }
})();

