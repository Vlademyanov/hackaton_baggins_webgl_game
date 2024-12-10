class StationManager {
    constructor(scene, ui, cashRegister) {
        this.scene = scene;
        this.ui = ui;
        this.cashRegister = cashRegister;
        console.log('StationManager UI initialized');

        this.stations = this.createStations();
        this.currentRecipe = {
            steps: [],
            targetSteps: [],
            status: 'waiting'
        };
        this.cup = this.createCup();
        this.trashBin = this.createTrashBin();
    }

    createStations() {
        return {
            espresso: this.createStation(1.5, 1, -2, "Эспрессо машина", "#ff0000"),
            water: this.createStation(2, 1, -3, "Горячая вода", "#0000ff"),
            milk: this.createStation(2, 1, -3.5, "Молочная станция", "#00ff00")
        };
    }

    createStation(x, y, z, name, color) {
        const station = BABYLON.MeshBuilder.CreateBox(
            name, { height: 0.5, width: 0.5, depth: 0.5 },
            this.scene
        );
        station.position = new BABYLON.Vector3(x, y, z);

        const material = new BABYLON.StandardMaterial(name + "Material", this.scene);
        material.diffuseColor = BABYLON.Color3.FromHexString(color);
        station.material = material;

        station.actionType = "coffee_station";
        station.stationType = name.toLowerCase();

        return station;
    }

    createCup() {
        const cup = BABYLON.MeshBuilder.CreateCylinder(
            "cup", { height: 0.15, diameter: 0.1 },
            this.scene
        );
        cup.position = new BABYLON.Vector3(1.5, 1.1, -2); // Рядом с кофемашиной

        // Создаем материал для стакана
        const cupMaterial = new BABYLON.StandardMaterial("cupMaterial", this.scene);
        cupMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        cup.material = cupMaterial;

        // Создаем содержимое стакана
        const liquid = BABYLON.MeshBuilder.CreateCylinder(
            "liquid", { height: 0.01, diameter: 0.09 },
            this.scene
        );
        liquid.position = new BABYLON.Vector3(1.5, 1.04, -2); // Чуть ниже верха стакана

        const liquidMaterial = new BABYLON.StandardMaterial("liquidMaterial", this.scene);
        liquidMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        liquid.material = liquidMaterial;

        return { cup, liquid, liquidMaterial };
    }

    updateCupContent(action) {
        const colors = {
            'espresso': new BABYLON.Color3(0.2, 0.1, 0),
            'hot_water': new BABYLON.Color3(0.8, 0.8, 0.8),
            'steamed_milk': new BABYLON.Color3(0.9, 0.9, 0.9),
            'milk_foam': new BABYLON.Color3(1, 1, 1)
        };

        const heights = {
            'espresso': 0,
            'hot_water': 0,
            'steamed_milk': 0,
            'milk_foam': 0
        };

        // Обновляем высоту жидкости
        const currentHeight = Math.min(
            0.12, // Максимальная высота
            this.currentRecipe.steps.length * 0.03 // Увеличиваем с каждым ингредиентом
        );

        this.cup.liquid.scaling.y = currentHeight / 0.01; // Масштабируем цилиндр
        this.cup.liquid.position.y = 1.04 + (currentHeight / 2); // Поднимаем позицию

        // Обновляем цвет жидкости
        if (colors[action]) {
            this.cup.liquidMaterial.diffuseColor = colors[action];
        }
    }

    resetCup() {
        // Сбрасываем высоту и цвет жидкости
        this.cup.liquid.scaling.y = 0.01;
        this.cup.liquid.position.y = 1.04;
        this.cup.liquidMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    }

    createTrashBin() {
        // Создаем ведро
        const bin = BABYLON.MeshBuilder.CreateCylinder(
            "trashBin", { height: 0.4, diameter: 0.3, tessellation: 16 },
            this.scene
        );
        bin.position = new BABYLON.Vector3(2, 0.2, -2); // Позиция на полу рядом с кофемашиной

        const binMaterial = new BABYLON.StandardMaterial("binMaterial", this.scene);
        binMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        bin.material = binMaterial;

        // Добавляем тип действия для интерактивности
        bin.actionType = "trash_bin";
        bin.stationType = "Ведро для слива";

        return bin;
    }

    async handleStationInteraction(station) {
        // Добавим проверку UI перед каждым взаимодействием
        if (!this.ui) {
            console.error('UI not available for interaction');
            return;
        }

        // Обработка взаимодействия с ведром
        if (station.actionType === "trash_bin") {
            if (this.currentRecipe.steps.length > 0) {
                const ingredients = this.currentRecipe.steps.map(step => {
                    const names = {
                        'espresso': 'эспрессо',
                        'hot_water': 'горячая вода',
                        'steamed_milk': 'вспененное молоко',
                        'milk_foam': 'молочная пена'
                    };
                    return names[step];
                }).join(', ');

                this.resetCup();
                // Сбрасываем рецепт, но сохраняем целевые шаги
                this.currentRecipe = {
                    status: 'preparing', // Меняем на 'preparing' вместо 'waiting'
                    steps: [],
                    targetSteps: this.currentRecipe.targetSteps
                };
                this.ui.updateRecipe(this.currentRecipe);
                this.ui.showHint(`🗑️ Вылито: ${ingredients}\nМожете начать приготовление заново`);

                // Обновляем информацию о заказе
                const currentOrder = this.cashRegister.getCurrentOrder();
                if (currentOrder) {
                    currentOrder.status = 'preparing';
                    this.cashRegister.showOrderDetails();
                }
                return;
            } else {
                this.ui.showHint('Стакан пуст, нечего выливать');
                return;
            }
        }

        const currentOrder = this.cashRegister.getCurrentOrder();

        if (!currentOrder || currentOrder.status !== 'preparing') {
            this.ui.showHint('⚠️ Сначала примите заказ на кассе');
            return;
        }

        const recipe = this.cashRegister.getRecipeForDrink(currentOrder.drink);
        if (!recipe) return;

        if (this.currentRecipe.status !== 'in_progress') {
            this.currentRecipe = {
                status: 'in_progress',
                targetSteps: recipe.steps,
                steps: []
            };
            this.ui.updateRecipe(this.currentRecipe);
        }

        const action = this.getStationAction(station);
        if (action) {
            await this.processStationAction(action);
        }
    }

    getStationAction(station) {
        const stationNames = {
            'эспрессо машина': 'espresso',
            'горячая вода': 'hot_water',
            'молочная станция': this.currentRecipe.steps.includes('steamed_milk') ?
                'milk_foam' : 'steamed_milk'
        };

        return stationNames[station.stationType.toLowerCase()] || null;
    }

    async processStationAction(action) {
        const currentStep = this.currentRecipe.targetSteps[this.currentRecipe.steps.length];

        // Перевод действий для подсказок
        const actionNames = {
            'espresso': 'эспрессо',
            'hot_water': 'горячую воду',
            'steamed_milk': 'вспененное молоко',
            'milk_foam': 'молочную пену'
        };

        if (action === currentStep) {
            this.currentRecipe.steps.push(action);
            this.updateCupContent(action);
            this.ui.updateRecipe(this.currentRecipe);

            if (this.currentRecipe.steps.length === this.currentRecipe.targetSteps.length) {
                this.currentRecipe.status = 'completed';
                this.cashRegister.completeOrder();
                this.ui.showHint('✅ Напиток готов! Отдайте его клиенту');
            } else {
                const nextStep = this.currentRecipe.targetSteps[this.currentRecipe.steps.length];
                this.ui.showHint(
                    `✅ Добавлено: ${actionNames[action]}\n` +
                    `Следующий шаг: ${actionNames[nextStep]}`
                );
            }
        } else {
            // Неправильный ингредиент - показываем подсказку
            this.currentRecipe.steps.push(action);
            this.updateCupContent(action);
            this.ui.updateRecipe(this.currentRecipe);

            const expectedAction = actionNames[currentStep];
            const actualAction = actionNames[action];

            this.ui.showHint(
                `❌ Ошибка! Вы добавили ${actualAction}, \n` +
                `а нужно было добавить ${expectedAction}.\n` +
                `Вылейте напиток в ведро и начните заново`
            );
        }
    }

    getInteractiveObjects() {
        return [...Object.values(this.stations), this.trashBin];
    }
}