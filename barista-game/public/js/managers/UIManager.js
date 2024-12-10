class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);

        // Создаем основные UI элементы
        this.crosshair = this.createCrosshair();
        this.hintPanel = this.createHintPanel(); // Верхняя панель для системных сообщений
        this.controlHint = this.createControlHint(); // Подсказка под прицелом
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

    createHintPanel() {
        const container = new BABYLON.GUI.Rectangle("hintPanel");
        container.width = "600px";
        container.height = "40px";
        container.cornerRadius = 10;
        container.color = "white";
        container.thickness = 1;
        container.background = "black";
        container.alpha = 0.7;
        container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        container.top = "20px";
        container.isVisible = false;

        const textBlock = new BABYLON.GUI.TextBlock("hintText");
        textBlock.text = "";
        textBlock.color = "white";
        textBlock.fontSize = 16;
        textBlock.textWrapping = true;
        textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        container.addControl(textBlock);
        this.advancedTexture.addControl(container);

        return { container, textBlock };
    }

    createControlHint() {
        const container = new BABYLON.GUI.StackPanel("controlHint");
        container.isVertical = true;
        container.height = "80px";
        container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        container.isVisible = false;

        // Создаем кнопку
        const keyText = new BABYLON.GUI.TextBlock("keyText");
        keyText.text = "[E]";
        keyText.color = "white";
        keyText.fontSize = 20;
        keyText.height = "30px";

        // Создаем текст действия
        const actionText = new BABYLON.GUI.TextBlock("actionText");
        actionText.text = "";
        actionText.color = "white";
        actionText.fontSize = 16;
        actionText.height = "30px";

        container.addControl(keyText);
        container.addControl(actionText);
        this.advancedTexture.addControl(container);

        return { container, keyText, actionText };
    }

    showHint(message, duration = 3000) {
        if (!this.hintPanel || !this.hintPanel.textBlock) return;

        this.hintPanel.textBlock.text = message;
        this.hintPanel.container.isVisible = true;

        // Автоматически скрываем через указанное время
        if (duration > 0) {
            setTimeout(() => {
                this.hintPanel.container.isVisible = false;
            }, duration);
        }
    }

    showControlHint(action) {
        if (!this.controlHint) return;

        if (action) {
            this.controlHint.actionText.text = action;
            this.controlHint.container.isVisible = true;
        } else {
            this.controlHint.container.isVisible = false;
        }
    }

    hideAllHints() {
        if (this.hintPanel) {
            this.hintPanel.container.isVisible = false;
        }
        if (this.controlHint) {
            this.controlHint.container.isVisible = false;
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