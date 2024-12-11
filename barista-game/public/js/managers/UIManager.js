class UIManager {
    constructor(scene) {
        this.scene = scene;

        // Создаем текстуру UI один раз
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        // Создаем элементы в правильном порядке
        this.crosshair = this.createCrosshair();
        this.controlHint = this.createControlHint();
        this.topHintPanel = this.createTopHintPanel();
        this.registerPanel = this.createRegisterPanel();
        this.recipePanel = this.createRecipePanel();
    }

    createCrosshair() {
        const crosshair = new BABYLON.GUI.Ellipse();
        crosshair.width = "10px";
        crosshair.height = "10px";
        crosshair.color = "white";
        crosshair.thickness = 2;
        this.advancedTexture.addControl(crosshair);
        return crosshair;
    }

    createTopHintPanel() {
        const panel = new BABYLON.GUI.Rectangle("topHintPanel");
        panel.width = "600px";
        panel.height = "40px";
        panel.cornerRadius = 10;
        panel.color = "white";
        panel.thickness = 1;
        panel.background = "black";
        panel.alpha = 0.7;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.top = "20px";
        panel.zIndex = 1000;

        const text = new BABYLON.GUI.TextBlock();
        text.text = "";
        text.color = "white";
        text.fontSize = 16;
        text.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        text.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        panel.addControl(text);
        this.advancedTexture.addControl(panel);

        return { panel, text };
    }

    createControlHint() {
        // Создаем корневую панель
        const actionText = new BABYLON.GUI.TextBlock("controlHintText");
        actionText.text = "";
        actionText.color = "white";
        actionText.fontSize = 16;
        actionText.height = "30px";
        actionText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        actionText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        actionText.top = "50px";
        actionText.isVisible = false;

        this.advancedTexture.addControl(actionText);

        return { actionText };
    }

    showHint(message, duration = 3000) {
        console.log('Показываем сообщение:', message); // Отладка
        if (!this.topHintPanel) {
            console.warn('topHintPanel не инициализирован');
            return;
        }

        // Очищаем предыдущий таймер если он есть
        if (this._hintTimer) {
            clearTimeout(this._hintTimer);
            this._hintTimer = null;
        }

        this.topHintPanel.text.text = message;
        this.topHintPanel.panel.isVisible = true;

        // Устанавливаем таймер только если duration > 0
        if (duration > 0) {
            this._hintTimer = setTimeout(() => {
                if (this.topHintPanel) {
                    this.topHintPanel.panel.isVisible = false;
                    this._hintTimer = null;
                }
            }, duration);
        }
    }

    showControlHint(action) {
        if (!this.controlHint) return;

        if (action) {
            this.controlHint.actionText.text = `ЛКМ ${action}`;
            this.controlHint.actionText.isVisible = true;
        } else {
            this.controlHint.actionText.isVisible = false;
        }
    }

    createRecipePanel() {
        const panel = new BABYLON.GUI.Rectangle("recipePanel");
        panel.width = "300px";
        panel.height = "200px";
        panel.cornerRadius = 20;
        panel.color = "white";
        panel.thickness = 1;
        panel.background = "black";
        panel.alpha = 0.7;
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.top = "20px";
        panel.left = "-20px";
        this.advancedTexture.addControl(panel);

        const text = new BABYLON.GUI.TextBlock();
        text.text = "Рецепт напитка";
        text.color = "white";
        text.fontSize = 16;
        text.textWrapping = true;
        panel.addControl(text);

        return { panel, text };
    }

    createRegisterPanel() {
        const panel = new BABYLON.GUI.Rectangle("registerPanel");
        panel.width = "300px";
        panel.height = "200px";
        panel.cornerRadius = 20;
        panel.color = "white";
        panel.thickness = 1;
        panel.background = "black";
        panel.alpha = 0.7;
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.top = "20px";
        panel.left = "20px";
        this.advancedTexture.addControl(panel);

        const text = new BABYLON.GUI.TextBlock();
        text.text = "Информация о заказе";
        text.color = "white";
        text.fontSize = 16;
        text.textWrapping = true;
        panel.addControl(text);

        panel.isVisible = false;
        return { panel, text };
    }

    showRegisterInfo(orderInfo) {
        if (typeof orderInfo === 'string') {
            this.registerPanel.text.text = orderInfo;
        } else {
            const typeText = orderInfo.type === 'online' ? 'Онлайн заказ' : 'Заказ в кафе';
            this.registerPanel.text.text =
                `${typeText}\n\n` +
                `Клиент: ${orderInfo.customerName}\n` +
                `Заказ: ${orderInfo.drink}\n\n` +
                `Рецепт:\n${orderInfo.recipe}\n\n` +
                `Статус: ${orderInfo.status}`;
        }
        this.registerPanel.panel.isVisible = true;
    }

    updateRecipe(recipe) {
        console.log("Обновляем рецепт:", recipe); // Отладка
        if (!recipe) return;

        const stepNames = {
            'espresso': 'Эспрессо',
            'hot_water': 'Горячая вода',
            'steamed_milk': 'Вспененное молоко',
            'milk_foam': 'Молочная пена'
        };

        let recipeText = "Рецепт напитка:\n\n";

        // Отображаем целевые шаги
        recipe.targetSteps.forEach((step, index) => {
            const stepName = stepNames[step];
            const isDone = recipe.steps[index] === step;
            const marker = isDone ? '✅' : '⭕';
            recipeText += `${marker} ${stepName}\n`;
        });

        this.recipePanel.text.text = recipeText;
        this.recipePanel.panel.isVisible = true;
    }

    hideRegisterInfo() {
        console.log('Скрываем информацию о заказе'); // Отладка
        this.registerPanel.panel.isVisible = false;
    }


}