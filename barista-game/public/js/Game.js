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

        // ��оздаем менеджер взаимодействий последним, так как он зависит от всех остальных
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

        // Пол
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
        const length = 3;

        const pick = this.scene.pickWithRay(ray, (mesh) => {
            return this.stationManager.getInteractiveObjects().includes(mesh);
        });

        console.log('Picked mesh:', pick.pickedMesh && pick.pickedMesh.stationType);

        if (pick.pickedMesh && pick.distance < length) {
            this.ui.handleInteraction(pick.pickedMesh);
            this.currentInteractiveObject = pick.pickedMesh;
        } else {
            this.ui.hideInteractionHint();
            this.currentInteractiveObject = null;
        }
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