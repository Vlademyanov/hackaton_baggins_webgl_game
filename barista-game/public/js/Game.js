class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = null;
        this.camera = null;
        this.ui = null;
        this.customerManager = null;
        this.cashRegister = null;
        this.stationManager = null;
        this.interactionManager = null;
        this.currentLookAtObject = null;
        this._lastHintTime = 0;
    }

    async initialize() {
        console.log('Initializing game...'); // Отладка
        this.scene = new BABYLON.Scene(this.engine);

        // Создаем компоненты в правильном порядке с правильными зависимостями
        this.camera = new CameraController(this.scene, this.canvas);
        this.ui = new UIManager(this.scene);

        // Создаем менеджеры с нужными зависимостями
        this.customerManager = new CustomerManager(this.scene, this.ui);
        this.cashRegister = new CashRegisterManager(this.scene, this.ui, this.customerManager);
        this.stationManager = new StationManager(this.scene, this.ui, this.cashRegister);

        // Cоздаем менеджер взаимодействий последним, так как он зависит от всех остальных
        this.interactionManager = new InteractionManager(
            this.scene,
            this.camera,
            this.stationManager,
            this.customerManager,
            this.cashRegister,
            this.ui
        );

        // Создаем базовое окружение
        this.createEnvironment();

        // Инициализируем начальное состояние
        this.customerManager.updateCustomerInfo();

        console.log('Game initialized with components:', {
            hasUI: !!this.ui,
            hasCustomerManager: !!this.customerManager,
            hasCashRegister: !!this.cashRegister,
            hasStationManager: !!this.stationManager
        });

        // Запускаем игровой цикл
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    createEnvironment() {
        // Освещение
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );

        // пол
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground", { width: 10, height: 10 },
            this.scene
        );
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0); // Чёрный цвет
        ground.material = groundMaterial;
    }

    checkInteractions() {
        const ray = this.camera.getForwardRay();
        const hit = this.scene.pickWithRay(ray);

        if (hit.pickedMesh) {
            this.currentLookAtObject = hit.pickedMesh;
            const interactionType = this.currentLookAtObject.actionType;
            console.log('Looking at:', interactionType); // Отладка

            if (interactionType) {
                let actionText = "";
                switch (interactionType) {
                    case "coffee_station":
                        actionText = this.currentLookAtObject.stationType;
                        break;
                    case "customer":
                        actionText = "Клиент";
                        break;
                    case "register":
                        actionText = "Касса";
                        break;
                    case "trash_bin":
                        actionText = "Ведро для слива";
                        break;
                }

                if (actionText) {
                    this.ui.showControlHint(actionText);
                }
            }
        } else {
            if (this.currentLookAtObject) {
                this.ui.showControlHint(null);
                this.currentLookAtObject = null;
            }
        }
    }

    showSystemMessage(message) {
        const currentTime = Date.now();
        if (currentTime - this._lastHintTime > 100) {
            this.ui.showHint(message);
            this._lastHintTime = currentTime;
        }
    }

    async handleStationInteraction(station) {
        this.showSystemMessage("Выполняется действие...");
    }

    async handleCustomerInteraction(customer) {
        this.showSystemMessage("Обслуживаем клиента...");
    }

    // Пример использования верхней панели для системных сообщений
    handleOrder() {
        this.ui.showHint("Заказ принят!", 3000);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('renderCanvas');
    game.initialize().then(() => {
        console.log('Game initialized successfully');
    }).catch(error => {
        console.error('Failed to initialize game:', error);
    });
});