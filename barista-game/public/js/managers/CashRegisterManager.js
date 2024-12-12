class CashRegisterManager {
    constructor(scene, ui, customerManager) {
        this.scene = scene;
        this.ui = ui;
        this.customerManager = customerManager;
        this.registerZone = this.createRegisterZone();
        this.currentOrder = null;
        this.recipes = {
            'американо': {
                steps: ['espresso', 'hot_water'],
                description: 'Эспрессо + горячая вода'
            },
            'латте': {
                steps: ['espresso', 'steamed_milk', 'milk_foam'],
                description: 'Эспрессо + вспененное молоко + молочная пена'
            },
            'капучино': {
                steps: ['espresso', 'steamed_milk', 'milk_foam'],
                description: 'Эспрессо + вспененное молоко + молочная пена'
            },
            'эспрессо': {
                steps: ['espresso'],
                description: 'Чистый эспрессо'
            }
        };
    }

    createRegisterZone() {
        const register = BABYLON.MeshBuilder.CreateBox(
            "register", { height: 1.2, width: 0.8, depth: 0.6 },
            this.scene
        );
        register.position = new BABYLON.Vector3(-2, 1, -2);
        register.actionType = "register";

        const material = new BABYLON.StandardMaterial("registerMaterial", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // С��рый цвет
        register.material = material;

        return register;
    }

    async handleRegisterInteraction() {
        const orderStatus = this.customerManager.getOrderStatus();
        const currentCustomer = this.customerManager.getCurrentCustomer();

        if (orderStatus === 'ordered' && currentCustomer) {
            // Оформление заказа
            this.currentOrder = {
                customerName: currentCustomer.name,
                drink: currentCustomer.order.drink,
                type: 'offline',
                status: 'preparing'
            };

            // Обновляем статус и показываем информацию
            this.customerManager.setOrderStatus('preparing');
            this.showOrderDetails();

            // Инициализируем рецепт
            const recipe = this.recipes[this.currentOrder.drink];
            if (recipe) {
                this.ui.updateRecipe({
                    status: 'in_progress',
                    steps: [],
                    targetSteps: recipe.steps
                });
            }

            this.ui.showHint('Заказ принят. Приступайте к приготовлению напитка');
        } else if (orderStatus === 'preparing' && this.currentOrder) {
            // Просмотр деталей заказа
            this.showOrderDetails();
        } else if (orderStatus === 'finished') {
            // Очистка заказа
            this.currentOrder = null;
            this.ui.hideRegisterInfo();
            this.ui.updateRecipe({
                status: 'waiting',
                steps: [],
                targetSteps: []
            });
            this.ui.showHint('Нажмите E на клиенте для нового заказа');
        } else if (orderStatus === 'waiting') {
            this.ui.showHint('Сначала примите заказ у клиента');
        }
    }

    showOrderDetails() {
        if (!this.currentOrder) return;

        const recipe = this.recipes[this.currentOrder.drink];
        if (!recipe) {
            console.error('Recipe not found for drink:', this.currentOrder.drink);
            return;
        }

        const orderInfo = {
            type: this.currentOrder.type,
            customerName: this.currentOrder.customerName,
            drink: this.currentOrder.drink,
            recipe: recipe.description,
            status: this.currentOrder.status
        };

        this.ui.showRegisterInfo(orderInfo);
    }

    completeOrder() {
        if (this.currentOrder && this.customerManager.getOrderStatus() === 'preparing') {
            this.currentOrder.status = 'ready';
            this.customerManager.setOrderStatus('ready');
            this.ui.showHint('Заказ готов! Отдайте его клиенту');
            this.showOrderDetails();
        }
    }

    getCurrentOrder() {
        return this.currentOrder;
    }

    getRecipeForDrink(drinkName) {
        return this.recipes[drinkName];
    }

    getInteractiveObjects() {
        return [this.registerZone];
    }
}