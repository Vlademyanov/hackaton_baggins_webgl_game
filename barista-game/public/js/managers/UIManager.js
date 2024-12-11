class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);

        // Создаем основные UI элементы
        this.crosshair = this.createCrosshair();
        this.topHintPanel = this.createTopHintPanel(); // Верхняя панель для сообщений
        this.controlHint = this.createControlHint(); // Подсказка под курсором
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
        panel.isVisible = false;
        panel.zIndex = 1000;

        const text = new BABYLON.GUI.TextBlock();
        text.text = "";
        text.color = "white";
        text.fontSize = 16;

        panel.addControl(text);
        this.advancedTexture.addControl(panel);

        return { panel, text };
    }

    createControlHint() {
        const panel = new BABYLON.GUI.Rectangle("controlHintPanel");
        panel.width = "200px";
        panel.height = "60px";
        panel.cornerRadius = 10;
        panel.color = "white";
        panel.thickness = 1;
        panel.background = "black";
        panel.alpha = 0.7;
        panel.isVisible = false;
        panel.linkOffsetY = 50;
        panel.linkWithMesh(this.crosshair);

        // Создаем контейнер для кнопки и текста
        const container = new BABYLON.GUI.StackPanel();
        container.isVertical = true;
        panel.addControl(container);

        // Кнопка
        const buttonText = new BABYLON.GUI.TextBlock();
        buttonText.text = "[E]";
        buttonText.color = "white";
        buttonText.fontSize = 20;
        buttonText.height = "30px";

        // Текст действия
        const actionText = new BABYLON.GUI.TextBlock();
        actionText.text = "";
        actionText.color = "white";
        actionText.fontSize = 16;
        actionText.height = "30px";

        container.addControl(buttonText);
        container.addControl(actionText);

        panel.zIndex = 999;
        this.advancedTexture.addControl(panel);

        return { panel, buttonText, actionText };
    }

    showHint(message, duration = 3000) {
        if (!this.topHintPanel) return;

        if (this._hintTimer) {
            clearTimeout(this._hintTimer);
        }

        this.topHintPanel.text.text = message;
        this.topHintPanel.panel.isVisible = true;

        if (duration > 0) {
            this._hintTimer = setTimeout(() => {
                this.topHintPanel.panel.isVisible = false;
                this._hintTimer = null;
            }, duration);
        }
    }

    showControlHint(action) {
        if (!this.controlHint) return;

        if (action) {
            this.controlHint.actionText.text = action;
            this.controlHint.panel.isVisible = true;
            this.controlHint.panel.linkWithMesh(this.crosshair);
        } else {
            this.controlHint.panel.isVisible = false;
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